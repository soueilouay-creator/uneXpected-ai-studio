import test from 'node:test';
import assert from 'node:assert/strict';
import { getRuntimeStatus } from '../runtime-client.mjs';

const token = '0123456789abcdef0123456789abcdef';
const host = 'runtime.example.invalid';

function env(overrides = {}) {
  return {
    UNEXPECTED_RUNTIME_BASE_URL: 'https://' + host,
    UNEXPECTED_RUNTIME_API_TOKEN: token,
    UNEXPECTED_RUNTIME_ALLOWED_HOSTS: host,
    ...overrides
  };
}

function payload(overrides = {}) {
  return {
    version: '8.0.0',
    health: { ok: true, status: 'ready' },
    registered_agents: 38,
    provider: 'mock',
    mode: 'test',
    storage: { backend: 'postgres', status: 'ready', healthy: true, recovery: 'verified' },
    governance: {
      privileged_actions: 'disabled',
      approval_authority: 'not verified',
      replay_protection: 'not verified'
    },
    private_payload: 'must-not-be-forwarded',
    ...overrides
  };
}

function jsonResponse(value, status = 200, contentType = 'application/json; charset=utf-8') {
  const body = typeof value === 'string' ? value : JSON.stringify(value);
  return new Response(body, { status, headers: { 'content-type': contentType } });
}

test('does not make a request when runtime configuration is absent', async () => {
  let calls = 0;
  const result = await getRuntimeStatus({
    env: {},
    fetchImpl: async () => { calls += 1; return jsonResponse(payload()); }
  });
  assert.equal(result.status, 'not_configured');
  assert.equal(result.configured, false);
  assert.equal(calls, 0);
});

test('fails closed on incomplete or unsafe runtime configuration', async () => {
  const cases = [
    env({ UNEXPECTED_RUNTIME_API_TOKEN: 'short' }),
    env({ UNEXPECTED_RUNTIME_BASE_URL: 'http://' + host }),
    env({ UNEXPECTED_RUNTIME_BASE_URL: 'https://' + host + '/nested' }),
    env({ UNEXPECTED_RUNTIME_BASE_URL: 'https://' + host + '?target=internal' }),
    env({ UNEXPECTED_RUNTIME_BASE_URL: 'https://' + host + ':8443' }),
    env({ UNEXPECTED_RUNTIME_BASE_URL: 'https://127.0.0.1', UNEXPECTED_RUNTIME_ALLOWED_HOSTS: '127.0.0.1' }),
    env({ UNEXPECTED_RUNTIME_ALLOWED_HOSTS: '*.example.invalid' }),
    env({ UNEXPECTED_RUNTIME_ALLOWED_HOSTS: 'another.example.invalid' })
  ];

  for (const configuration of cases) {
    let calls = 0;
    const result = await getRuntimeStatus({
      env: configuration,
      fetchImpl: async () => { calls += 1; return jsonResponse(payload()); }
    });
    assert.equal(result.status, 'misconfigured');
    assert.equal(calls, 0);
  }
});

test('uses only the allowlisted HTTPS status endpoint and returns a safe field projection', async () => {
  let requestedUrl;
  let requestOptions;
  const result = await getRuntimeStatus({
    env: env(),
    fetchImpl: async (url, options) => {
      requestedUrl = new URL(url).href;
      requestOptions = options;
      return jsonResponse(payload());
    }
  });

  assert.equal(requestedUrl, 'https://' + host + '/v1/status');
  assert.equal(requestOptions.method, 'GET');
  assert.equal(requestOptions.headers.authorization, 'Bearer ' + token);
  assert.equal(requestOptions.headers.accept, 'application/json');
  assert.equal(requestOptions.redirect, 'error');
  assert.equal(requestOptions.cache, 'no-store');
  assert.equal(result.status, 'connected');
  assert.equal(result.runtime.registeredAgents, 38);
  assert.equal(result.runtime.storage.backend, 'postgres');
  assert.equal(JSON.stringify(result).includes('must-not-be-forwarded'), false);
  assert.equal(JSON.stringify(result).includes(token), false);
});

test('reports upstream authentication failures without forwarding response bodies', async () => {
  const result = await getRuntimeStatus({
    env: env(),
    fetchImpl: async () => new Response('private upstream detail', {
      status: 401,
      headers: { 'content-type': 'text/plain' }
    })
  });

  assert.equal(result.status, 'upstream_unauthorized');
  assert.equal(result.httpStatus, 401);
  assert.equal(JSON.stringify(result).includes('private upstream detail'), false);
});

test('rejects oversized, non-JSON, and malformed status responses', async () => {
  const oversized = await getRuntimeStatus({
    env: env(),
    fetchImpl: async () => jsonResponse('x'.repeat(17 * 1024))
  });
  assert.equal(oversized.status, 'invalid_response');

  const nonJson = await getRuntimeStatus({
    env: env(),
    fetchImpl: async () => jsonResponse('{}', 200, 'text/plain')
  });
  assert.equal(nonJson.status, 'invalid_response');

  const malformed = await getRuntimeStatus({
    env: env(),
    fetchImpl: async () => jsonResponse('{not-json')
  });
  assert.equal(malformed.status, 'invalid_response');

  const wrongSchema = await getRuntimeStatus({
    env: env(),
    fetchImpl: async () => jsonResponse({ version: '8.0.0', health: { ok: true } })
  });
  assert.equal(wrongSchema.status, 'invalid_response');
});

test('marks an unhealthy runtime as degraded without treating it as connected', async () => {
  const result = await getRuntimeStatus({
    env: env(),
    fetchImpl: async () => jsonResponse(payload({
      health: { ok: false, status: 'degraded' },
      storage: { backend: 'postgres', status: 'unavailable', healthy: false, recovery: 'not verified' }
    }))
  });
  assert.equal(result.status, 'degraded');
  assert.equal(result.runtime.health.ok, false);
  assert.equal(result.runtime.storage.healthy, false);
});

test('classifies an aborted request as a timeout and does not retry it', async () => {
  let calls = 0;
  const result = await getRuntimeStatus({
    env: env(),
    timeoutMs: 10,
    fetchImpl: async (_url, options) => {
      calls += 1;
      return new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        }, { once: true });
      });
    }
  });

  assert.equal(result.status, 'timeout');
  assert.equal(calls, 1);
});
