import { isIP } from 'node:net';

const DEFAULT_TIMEOUT_MS = 5000;
const MAX_RESPONSE_BYTES = 16 * 1024;

function unavailable(status, reason, extra = {}) {
  return { configured: false, status, reason, ...extra };
}

function safeText(value, limit = 80) {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return cleaned ? cleaned.slice(0, limit) : null;
}

function readConfiguration(env) {
  const base = String(env.UNEXPECTED_RUNTIME_BASE_URL || '').trim();
  const token = String(env.UNEXPECTED_RUNTIME_API_TOKEN || '').trim();

  if (!base || !token) {
    return unavailable('not_configured', 'The runtime endpoint and server-side API token are not both configured.');
  }
  if (token.length < 32 || !/^[\x21-\x7e]+$/.test(token)) {
    return unavailable('misconfigured', 'The runtime API token must contain at least 32 printable ASCII characters.');
  }

  let parsed;
  try {
    parsed = new URL(base);
  } catch {
    return unavailable('misconfigured', 'The runtime base URL is invalid.');
  }

  if (
    parsed.protocol !== 'https:' ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    !['', '/'].includes(parsed.pathname) ||
    parsed.port
  ) {
    return unavailable('misconfigured', 'The runtime base URL must be an HTTPS origin without credentials, path, query, fragment, or non-default port.');
  }

  const hostname = parsed.hostname.toLowerCase();
  const ipCandidate = hostname.replace(/^\[|\]$/g, '');
  if (!hostname || hostname.endsWith('.') || isIP(ipCandidate)) {
    return unavailable('misconfigured', 'IP literals and non-canonical runtime hostnames are not allowed.');
  }

  const allowedHosts = String(env.UNEXPECTED_RUNTIME_ALLOWED_HOSTS || '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);

  if (!allowedHosts.includes(hostname)) {
    return unavailable('misconfigured', 'The runtime hostname is not in the exact server-side allowlist.');
  }

  return {
    configured: true,
    url: new URL('/v1/status', parsed.origin),
    token
  };
}

async function readBoundedText(response) {
  if (!response.body || typeof response.body.getReader !== 'function') {
    const text = await response.text();
    return Buffer.byteLength(text, 'utf8') <= MAX_RESPONSE_BYTES ? text : null;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const item = await reader.read();
      if (item.done) break;
      total += item.value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        await reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(Buffer.from(item.value));
    }
    return Buffer.concat(chunks).toString('utf8');
  } finally {
    try { reader.releaseLock(); } catch {}
  }
}

function normalizeStatus(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  if (typeof payload.version !== 'string') return null;
  if (!payload.health || typeof payload.health.ok !== 'boolean') return null;
  if (!payload.storage || typeof payload.storage.healthy !== 'boolean') return null;
  if (!Number.isInteger(payload.registered_agents) || payload.registered_agents < 0 || payload.registered_agents > 1000) return null;

  return {
    version: safeText(payload.version),
    health: {
      ok: payload.health.ok,
      status: safeText(payload.health.status)
    },
    registeredAgents: payload.registered_agents,
    provider: safeText(payload.provider),
    mode: safeText(payload.mode),
    storage: {
      backend: safeText(payload.storage.backend),
      status: safeText(payload.storage.status),
      healthy: payload.storage.healthy,
      recovery: safeText(payload.storage.recovery)
    },
    governance: {
      privilegedActions: safeText(payload.governance?.privileged_actions),
      approvalAuthority: safeText(payload.governance?.approval_authority),
      replayProtection: safeText(payload.governance?.replay_protection)
    }
  };
}

export async function getRuntimeStatus({
  env = process.env,
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS
} = {}) {
  const config = readConfiguration(env);
  if (!config.configured) return config;
  if (typeof fetchImpl !== 'function') {
    return unavailable('unavailable', 'The server HTTP client is unavailable.', { configured: true });
  }

  const controller = new AbortController();
  const boundedTimeout = Math.max(1, Math.min(Number(timeoutMs) || DEFAULT_TIMEOUT_MS, 10000));
  const timer = setTimeout(() => controller.abort(), boundedTimeout);

  try {
    const response = await fetchImpl(config.url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: 'Bearer ' + config.token
      },
      cache: 'no-store',
      redirect: 'error',
      signal: controller.signal
    });

    if (!response || typeof response.ok !== 'boolean') {
      return unavailable('invalid_response', 'The runtime returned an invalid HTTP response.', { configured: true });
    }
    if (response.redirected) {
      return unavailable('redirect_blocked', 'Runtime redirects are not accepted.', { configured: true });
    }
    if (!response.ok) {
      const status = response.status === 401 || response.status === 403
        ? 'upstream_unauthorized'
        : response.status === 404
          ? 'endpoint_not_found'
          : 'upstream_error';
      return unavailable(status, 'The runtime status request was not successful.', {
        configured: true,
        httpStatus: Number.isInteger(response.status) ? response.status : null
      });
    }

    const contentType = String(response.headers?.get?.('content-type') || '');
    if (!/^application\/(?:[a-z0-9.+-]*\+)?json(?:\s*;|$)/i.test(contentType)) {
      return unavailable('invalid_response', 'The runtime status response was not JSON.', { configured: true });
    }

    const declaredLength = Number(response.headers?.get?.('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
      return unavailable('invalid_response', 'The runtime status response exceeded the size limit.', { configured: true });
    }

    const body = await readBoundedText(response);
    if (body === null) {
      return unavailable('invalid_response', 'The runtime status response exceeded the size limit.', { configured: true });
    }

    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      return unavailable('invalid_response', 'The runtime status response was not valid JSON.', { configured: true });
    }

    const runtime = normalizeStatus(payload);
    if (!runtime || !runtime.version) {
      return unavailable('invalid_response', 'The runtime status response did not match the expected schema.', { configured: true });
    }

    return {
      configured: true,
      status: runtime.health.ok && runtime.storage.healthy ? 'connected' : 'degraded',
      runtime
    };
  } catch (error) {
    return unavailable(
      controller.signal.aborted || error?.name === 'AbortError' ? 'timeout' : 'unavailable',
      'The runtime status request could not be completed.',
      { configured: true }
    );
  } finally {
    clearTimeout(timer);
  }
}
