# uneXpected AI Studio — ChatGPT × Claude

A small Node.js application that can route a task to OpenAI, Claude, or both. Provider keys remain on the server; a configured key is not treated as proof that a provider works.

## Deploy

This repository contains:
- `Dockerfile` — builds the service on Render
- `render.yaml` — Render Blueprint with generated app access token and private provider-secret prompts
- `source.tar.gz.b64` — source bundle uploaded through the Git integration; the Docker build decodes and unpacks it into the runtime image

Create a Render Blueprint from this repository or a Docker web service from branch `main`. Set `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` in Render's private environment settings. Never store provider keys in Git. The app access token is separate from both provider keys.

## Test

Open `/health` to see service and credential-presence status. Then open the app, set the generated `UNEXPECTED_ACCESS_TOKEN` under Access settings, and click the separate Test ChatGPT API and Test Claude API buttons. These buttons make real API calls and may incur provider charges. A green health endpoint alone is not a provider test.

## TAAFT AI discovery

OpenAI and Claude requests can use TAAFT's official public MCP catalog for relevant AI-tool, model, and MCP-server discovery. The integration is read-only and restricted to an explicit allowlist of search and detail tools. It does not access private TAAFT account data. OpenRouter fallback requests are not connected to TAAFT. See [docs/TAAFT_MCP_INTEGRATION.md](docs/TAAFT_MCP_INTEGRATION.md) for privacy boundaries, tool allowlisting, and verification.

## Models

Defaults in this deployment are `gpt-4.1` and `claude-sonnet-4-5-20250929`; override them if those models are not enabled for your API accounts. See the [OpenAI model catalog](https://developers.openai.com/api/docs/models) and [Anthropic model overview](https://platform.claude.com/docs/en/models/overview).

## Security

No API keys are committed. The app's private endpoints require a bearer access token, requests are size-limited, and the app does not persist prompts or responses. Rotate any key that has previously been exposed.


## Optional OpenRouter free-model fallback

When every requested primary provider fails, the gateway can make one fallback attempt through OpenRouter's `openrouter/free` router. It chooses an available free model for the request; the result is not ChatGPT or Claude, and this fallback is not connected to TAAFT.

1. Create an OpenRouter account and API key at [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys). OpenRouter documents a free account and free-model access without a credit purchase.
2. In the Render service's Environment page, add `OPENROUTER_API_KEY` with the key value. Keep it in Render only; never commit it or paste it into the Studio page.
3. Save the environment change and wait for Render to finish its automatic redeploy.
4. Open the Studio, enter the existing `UNEXPECTED_ACCESS_TOKEN` in **Access settings** if needed, and click **Use token for this tab**. Then click **Test OpenRouter API** in System status.

The Studio health display distinguishes **not configured**, **configured but not yet verified**, and **verified after a real test request**. The test uses one small real OpenRouter request and does not call ChatGPT or Claude. The access token is retained in this tab's session storage only.

The default model is `openrouter/free`. OpenRouter currently documents a free-model limit of 20 requests per minute and 50 requests per day; failed attempts count toward the daily cap. Availability and provider capacity can change. Check the [current free-model guidance](https://openrouter.ai/collections/free-models/) before relying on the fallback for production workloads.

OpenRouter sends requests to third-party model providers. Review the selected model/provider's data handling terms before sending confidential or sensitive prompts. The fallback does not restore OpenAI or Anthropic API credits and does not make their models available.

## Normal task fallback and result provenance

The `POST /orchestrate` response keeps provider results separate: `results.openai`, `results.anthropic`, `results.openrouter`, and (when primary answers exist) `results.synthesis`. Each successful provider result identifies its `provider`, configured `requestedModel`, actual returned `model`, latency, status, and text. OpenRouter is never stored in the synthesis slot.

The top-level `fallback` object reports `not_attempted`, `not_configured`, `succeeded`, or `failed`, including the provider and requested route. The gateway makes at most one OpenRouter request, and only if all providers selected by the task mode fail to return usable text. It does not spend free-model requests when a requested primary provider succeeds. A failed or unconfigured fallback returns an error/status entry, never a simulated answer.


## uneXpected Phone workspace

The installable phone PWA is served at `/mobile/`. Its reviewed source is in `mobile-release/`; CI overlays that source over the archived phone assets before running integration tests, and the Docker image copies it into `/app/public/mobile/`.

Phone conversations support a per-message route selector:
- `openai` — ChatGPT
- `claude` — Claude
- `openrouter` — direct OpenRouter free-model routing
- `both` — compare ChatGPT and Claude, then synthesize when possible
- `local` — use local workspace commands without a model request

The selected route applies to the next message only. Earlier conversation turns keep their original provider attribution. Assistant responses display their provider, actual returned model, requested route when different, latency, and whether OpenRouter was used as a fallback. A direct OpenRouter request is made once and does not start a second OpenRouter fallback attempt. The automatic OpenRouter fallback remains enabled for primary-provider routes when no requested primary provider returns usable text.

The phone interface uses a responsive left navigation drawer on narrow screens and a persistent sidebar on wider screens. Local projects, conversations, memories, improvements, profile browsing, voice controls, and backup export/import remain on-device. The mobile gateway access token stays in memory only; it is not written to IndexedDB, browser storage, or backups. Provider API keys remain server-side.


## Excel Engineering

The repository includes a general-purpose Excel specialist coordinating macro-free Excel, the pinned Excelize v2.11.0 worker, and the desktop VBA toolkit. OpenAI Responses and Anthropic Messages now receive native client tools for excel_inspect and excel_generate on detected Excel tasks. The main browser app and phone PWA support authenticated .xlsx upload and generated workbook downloads.

Workflow: upload a workbook to POST /excel/upload, send its returned file ID in excelFiles to POST /orchestrate, and download a generated artifact using the returned authenticated downloadPath. Uploads and outputs are private temporary files and expire after 30 minutes. Only the IDs attached to the current request can be inspected; workbook preview rows are bounded and passed to the chosen provider. OpenRouter and Local mode do not support attached workbook tools, and the gateway avoids implying that a text fallback processed a workbook.

The first release supports .xlsx only. It does not execute VBA or macros and is not a complete Excel formula calculation engine. File storage is process-local, not shared across replicas or restarts; do not scale horizontally or depend on durable artifact links until private shared storage is separately implemented and tested. See [the Excel worker and native-tool contracts](integrations/excel-engine/agent/TOOL_CONTRACTS.md), [specialist instructions](specialists/excel/AGENT.md), and the seven reusable skills under specialists/excel/skills.
