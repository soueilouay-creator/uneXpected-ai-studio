# Vice City Files — discovery and clipping pipeline

Status: implementation specification; not deployed.

## Product goal

Build a reusable uneXpected V8 workflow for discovering public English-language GTA VI livestreams and replays, ranking promising moments, verifying reuse permission, and preparing original transformative Shorts for human review.

The workflow must not equate public availability, a creator's use of Twitch clips, or a platform's clip button with permission to download, edit, or repost.

## Operating constraints

- Default spend: $0. No trials, subscriptions, purchases, paid APIs, or chargeable exports without separate explicit approval.
- Phone is the control surface only. Do not assume the Android device can host Docker, video transcoding, or a persistent worker.
- Keep every result in draft/candidate state.
- Never contact creators, upload, schedule, publish, or change channel settings.
- Never download, transcribe, edit, or clip a candidate until explicit reuse permission is evidenced and recorded.
- Do not bypass platform restrictions, DRM, access controls, or private content.
- Keep credentials server-side; never put secrets in Git or ask the user to paste secrets into chat.
- Every report includes Completed, Verified, Blocked, and Next.

## Pipeline

1. **Discover**
   - Search public YouTube and Twitch streams/VODs for English-language GTA VI content.
   - Prefer newly live streams and newly published replays.
   - Store canonical source URL, platform, creator/channel, title, discovery time, live/replay status, language evidence, and viewer context with retrieval time and source.
2. **Classify**
   - Classify as confirmed GTA VI gameplay, GTA V, countdown, speculation, IRL/promo, misleading/unclear, or unverified pre-release claim.
   - Require corroborating evidence for confirmed gameplay; titles, thumbnails, tags, and chat claims alone are insufficient.
   - Exclude false positives from the production queue while retaining a short reason.
3. **Moment shortlist**
   - Identify funny reactions, surprising gameplay, discoveries/secrets, impressive plays, and memorable interactions.
   - Record exact source offsets only when the VOD can actually be inspected. Never estimate timestamps from clip duration or a title.
   - Record a concise hook, why the moment works, proposed in/out points, context needed to avoid misleading edits, and transformation notes.
4. **Rights gate**
   - Record permission state: `explicit_reuse_allowed`, `platform_clip_only`, `unclear`, `not_allowed`, or `unknown`.
   - Evidence must be a creator-authored statement or license that clearly covers downloading/editing and reposting on the intended channel/platform. Store the exact URL, quoted short evidence, scope, date checked, and any attribution/monetization conditions.
   - A platform clip feature, public VOD, fan clip, or absence of a copyright notice is not permission.
   - If permission is not explicit and in-scope, mark BLOCKED; show the creator's public contact/permission route. Do not contact them.
5. **Clipping eligibility**
   - Only after the rights gate passes, check the actual free quota/balance and all costs for the chosen workflow.
   - Stop if a paid model/API, paid quota, trial, subscription, purchase, or chargeable export is required.
   - If no verified free capacity exists, return timestamps and edit notes only.
6. **Create and QA**
   - When eligible, use the self-hosted SupoClip worker for VODs (not live streams). SupoClip currently documents YouTube/Twitch VOD imports, AI moment selection, vertical 9:16 output, captions, hook titles, and editing.
   - QA the encoded MP4: source integrity, correct in/out points, audio, captions, framing, transitions, black frames/freezes, mobile readability, and whether edits add context/commentary/analysis rather than merely reposting.
   - Preserve source attribution and permission conditions.
7. **Draft handoff**
   - Store candidate/clip metadata, permission evidence, source timestamps, QA result, and suggested title/description/hashtags as drafts.
   - Publishing remains disabled. A future publishing integration must require a separate explicit approval for each upload or a clearly bounded user-approved policy.

## SupoClip integration notes

Upstream: https://github.com/FujiwaraChoki/supoclip

- Upstream describes itself as AGPL-3.0 licensed. Review license obligations before distributing or hosting a modified version.
- Upstream README says it accepts YouTube and Twitch VODs/clips; live streams are not supported.
- Upstream quick start requires Docker, an AssemblyAI API key, and an LLM provider key. Therefore, the upstream stack is not automatically a $0 workflow.
- A self-hosted deployment may avoid hosted-plan metering, but compute, transcription, LLM inference, storage, bandwidth, and electricity still have costs. Verify each component before use.
- Prefer local Whisper/Ollama only after hardware capability and resource requirements are assessed.
- Do not deploy SupoClip on the existing uneXpected production service without a separate architecture, security, resource, and cost review. Keep the worker isolated from the model gateway and from channel publishing credentials.

## Minimal candidate record

```json
{
  "id": "stable-id",
  "platform": "youtube|twitch",
  "creator": "channel name",
  "source_url": "https://...",
  "title": "source title",
  "status": "live|replay",
  "language": "en|unknown",
  "game_classification": "confirmed_gta_vi|gta_v|countdown|speculation|irl_promo|misleading|unverified",
  "classification_evidence": [],
  "viewer_context": { "value": null, "captured_at": null, "source_url": null },
  "moments": [
    {
      "start_seconds": null,
      "end_seconds": null,
      "timestamp_verified": false,
      "moment_type": "reaction|discovery|secret|play|interaction",
      "hook": "",
      "edit_notes": ""
    }
  ],
  "permission": {
    "state": "unknown",
    "evidence_url": null,
    "evidence_excerpt": null,
    "scope": null,
    "conditions": []
  },
  "clipping": { "eligible": false, "free_quota_verified": false, "cost_checked": false },
  "production_state": "candidate|blocked|draft|qa_passed",
  "publish_state": "disabled"
}
```

## Acceptance tests

- GTA V and countdown results never enter the confirmed-GTA-VI queue without evidence.
- Missing/unclear permission blocks all download, edit, and clip actions.
- Public availability and third-party clips never satisfy the rights gate.
- Unverified timestamps are never presented as exact.
- Paid quota, paid API, trial, subscription, or chargeable export is rejected by default.
- Live streams are not passed to SupoClip; only eligible VOD sources are.
- Publishing endpoints/actions remain disabled in this workflow.
- Every run emits all four report sections, including a clear no-match result.
- Retries are bounded; duplicate candidates are deduplicated by platform and canonical source URL.

## Build sequence

1. Implement candidate schema, deduplication, classification, and rights-gate tests.
2. Implement YouTube/Twitch discovery adapters with current API/access constraints documented.
3. Add timestamped inspection and evidence capture.
4. Add isolated SupoClip adapter behind a feature flag, disabled until a verified self-hosted worker and free-cost profile exist.
5. Add draft review UI and regression tests.
6. Consider publishing only after a separate approval and security review.

## Current state

- This document is a specification on a feature branch.
- No worker is deployed or running.
- No video was downloaded or edited.
- No creator was contacted.
- No channel was connected or changed.
- No content was published or scheduled.
