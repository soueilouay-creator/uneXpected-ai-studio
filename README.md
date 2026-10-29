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

## Models

Defaults in this deployment are `gpt-4.1` and `claude-sonnet-4-5-20250929`; override them if those models are not enabled for your API accounts. See the [OpenAI model catalog](https://developers.openai.com/api/docs/models) and [Anthropic model overview](https://platform.claude.com/docs/en/models/overview).

## Security

No API keys are committed. The app's private endpoints require a bearer access token, requests are size-limited, and the app does not persist prompts or responses. Rotate any key that has previously been exposed.
