# uneXpected Mobile Video Studio Implementation Plan

**Status:** Phone media-export milestone and opt-in synchronized silence trimming implemented on `feat/mobile-video-studio`; production runtime activation remains blocked on FFmpeg/FFprobe availability and resource verification.

**Goal:** Add a $0-first, phone-oriented media pipeline that converts SRT timing and 3×3 storyboard images plus narration audio into a downloadable vertical MP4 without installing the creator's unverified APKs.

**Architecture:** Dependency-free Node media modules parse SRT, calculate deterministic 3×3 crop geometry, build safe FFmpeg argument arrays, probe inputs, and assemble MP4. The existing gateway exposes bearer-authenticated, rate-limited, size-bounded operations. The phone PWA sends files only after the user taps Render MP4. FFmpeg and FFprobe remain optional runtime capabilities and the UI disables export until both are detected.

## Global constraints

- Keep the default workflow at $0; no paid APIs, credits, trials, or commercial dependencies.
- Treat the APKs as functional references only; they were not installed or executed.
- Preserve existing bearer authentication and same-origin gateway behavior.
- Do not store provider keys, media, or generated exports in Git.
- Do not deploy, merge, publish, or alter production Render configuration.
- Do not claim a production MP4 exists until it is generated and inspected with a real media toolchain.

---

## Task 1: Deterministic subtitle and storyboard primitives — complete

**Files:** `media-studio/srt.mjs`, `media-studio/storyboard.mjs`, `test/media-studio.test.mjs`

- [x] Parse LF/CRLF SRT, multiline text, comma/dot timestamps, and empty input.
- [x] Reject malformed timestamps and non-positive cue durations.
- [x] Calculate 3×3 crop geometry with remainder pixels distributed without gaps or overlaps.
- [x] Run focused and full Node tests.

## Task 2: Safe FFmpeg media operations — complete, runtime optional

**Files:** `media-studio/ffmpeg.mjs`, `Dockerfile`, `test/media-studio.test.mjs`

**Interfaces:**
- `buildSplitArgs(...)` splits the storyboard into numbered scene images.
- `buildRenderArgs(...)` creates a 1080×1920 H.264/AAC MP4 and embeds SRT as a selectable `mov_text` subtitle stream.
- `runFfmpeg(...)` uses argument arrays, a bounded timeout, and no shell interpolation.
- `probeImageDimensions(...)` and `probeAudioDuration(...)` validate media metadata with bounded FFprobe output and timeouts.

- [x] Test spaces and special characters in paths, unavailable binaries, timeouts, process failures, render options, image metadata, narration duration, silence detection and cue retiming.
- [x] Implement deterministic split/render command construction and bounded process execution.
- [x] Include `media-studio/` in the Docker image and verify module imports inside the built container.
- [x] Keep FFmpeg/FFprobe optional instead of adding them to the production image. Their size and CPU/memory/disk cost have not been established against the target free Render runtime; the app reports unavailable instead of fabricating output.
- [x] Verify a real local 9-scene render using FFmpeg/FFprobe installed in the QA environment: 9 storyboard crops, 1080×1920 H.264 video, AAC audio, 30 fps, and an embedded `mov_text` subtitle stream.
- [x] Add opt-in long-pause removal: detect pauses >=450 ms at -42 dB; preserve 100 ms at detected edges; never shrink a subtitle cue below 250 ms; recalculate subtitle times and report milliseconds removed.

## Task 3: Authenticated gateway and phone Studio — complete

**Files:** `server.js`, `mobile-release/index.html`, `mobile-release/app.js`, `mobile-release/styles.css`, `mobile-release/sw.js`, `.github/workflows/mobile-integration.yml`

**Routes:**
- `POST /media-studio/inspect-srt` validates SRT text and returns cue timing.
- `GET /media-studio/status` checks FFmpeg/FFprobe without exposing their filesystem paths.
- `POST /media-studio/render` accepts storyboard image, narration audio, and SRT; performs storyboard splitting and MP4 assembly; and returns the video as a download.

**Boundaries:** bearer auth on every route; media-render rate limit; JSON body capped at 28 MB; storyboard 8 MB; narration 12 MB; SRT 48 KB; 1–9 continuous cues starting at zero; 120-second cue timeline; 64 MB MP4 output. File signatures are checked, server-side byte ceilings cannot be overridden by request properties, FFprobe validates image/audio metadata, and narration shorter than the final SRT cue by more than 100 ms is rejected. Temporary files use a private workspace and are deleted before a successful response or after a failed job.

- [x] Test unauthorized, malformed, MIME-spoofed, oversized, unavailable-engine, successful render orchestration, short narration, and temporary-file cleanup paths.
- [x] Preserve existing gateway authorization and orchestration behavior.
- [x] Add a mobile Studio view with SRT inspection, storyboard/narration file inputs, engine status, and MP4 download.
- [x] Keep the Render button disabled until the gateway verifies FFmpeg and FFprobe. Access token remains in memory; no microphone permission is requested.
- [x] Bump the service-worker cache to `unexpected-mobile-v0.4.1` so installed PWAs refresh the new UI assets.

## Task 4: Verification and handoff — complete for the feature branch

- [x] Document the workflow, zero-cost scope, APK non-installation decision, runtime dependency, input limits, and known limitations.
- [x] Run syntax checks and `node --test test/*.test.mjs`: **63 tests passed, 0 failed** (at CI run 43730303905 before final media-quality QA).
- [x] Build the Docker image in CI and import all five media modules inside the built container.
- [ ] Perform a real local 9-scene FFmpeg/FFprobe render with a deliberately inserted silent pause; verify shortened audio duration and all retimed subtitle cues.
- [x] Inspect the branch diff: feature work remains isolated from `main`; no APK, generated video, provider secret, or production configuration change was added.
- [x] Keep the work on `feat/mobile-video-studio`; do not merge, deploy, or publish.

## Remaining boundary (not represented as completed work)

- The Docker image does **not** bundle FFmpeg/FFprobe. Real rendering on the deployed gateway will remain disabled until a compatible runtime provides both binaries. No Render production service was modified or redeployed.
- Narration is supplied as an audio file; the Studio does not generate TTS narration.
- Automatic clip selection, stream monitoring, and publishing are not included in this milestone.
- CI's end-to-end server test uses fake FFmpeg/FFprobe tools to verify gateway orchestration. The separate local render verifies the command builders with real FFmpeg, but does not prove that Render has the same binaries or resources.
