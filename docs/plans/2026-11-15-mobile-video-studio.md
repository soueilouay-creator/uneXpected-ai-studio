# uneXpected Mobile Video Studio Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a $0-first, phone-oriented media pipeline that converts SRT timing and storyboard images plus narration audio into a rendered MP4 without installing the creator's unverified APKs.

**Architecture:** Add a dependency-free Node media module for strict SRT parsing, deterministic 3×3 storyboard splitting through FFmpeg, and MP4 render command construction/execution. Expose authenticated, bounded server operations only after the core module is covered by Node tests; integrate a small mobile Studio view that submits a local project manifest and media files through the existing same-origin gateway. FFmpeg is an optional runtime capability and must be reported unavailable rather than silently substituting output.

## Global Constraints

- Keep the default workflow at $0; do not add paid APIs, credits, trials, or commercial dependencies.
- Treat the three APKs as functional references only; do not install or execute them.
- Keep media processing behind existing bearer authentication, strict request/file limits, and safe temporary paths.
- Do not store provider keys or media in Git.
- Do not deploy, merge, publish, or alter production Render configuration.
- Report unsupported browser/device capabilities honestly; never claim an MP4 exists until a real export is verified.

---

### Task 1: Deterministic subtitle and storyboard primitives

**Files:**
- Create: `media-studio/srt.mjs`
- Create: `media-studio/storyboard.mjs`
- Test: `test/media-studio.test.mjs`

**Interfaces:**
- `parseSrt(source) -> Array<{index,startMs,endMs,text}>`
- `formatSrtTimestamp(milliseconds) -> string`
- `buildGridCropFilters({width,height,rows,columns}) -> Array<{index,x,y,width,height}>`
- Consumes SRT text and image dimensions; produces normalized subtitle cues and deterministic crop rectangles.

- [ ] Add tests for CRLF/LF, multiline cue text, comma/dot timestamps, empty input, malformed timestamps, non-positive cue duration, and exact nine-cell crop geometry including remainder pixels.
- [ ] Verify tests fail because module exports are absent.
- [ ] Implement the smallest pure functions; reject malformed cue timing and invalid image/grid dimensions with actionable errors.
- [ ] Run focused tests and full existing Node test suite.

### Task 2: Safe FFmpeg media operations

**Files:**
- Create: `media-studio/ffmpeg.mjs`
- Test: `test/media-studio.test.mjs`
- Modify: `Dockerfile`

**Interfaces:**
- `buildSplitArgs({inputPath,outputPattern,width,height,rows,columns}) -> string[]`
- `buildRenderArgs({audioPath,scenePaths,cues,outputPath,options}) -> string[]`
- `runFfmpeg(args,{spawnImpl,timeoutMs}) -> Promise<{code,stderr}>`
- Uses argument arrays (never shell interpolation), bounded timeout, and explicit FFmpeg binary detection.
- MP4 output is 1080×1920 by default, H.264/AAC, subtitles are generated as a sidecar SRT, and scene durations derive from cue timing.

- [ ] Add tests for shell-metacharacter paths, missing binary, timeout, non-zero exit, and exact render options.
- [ ] Verify expected red before implementation.
- [ ] Implement argument builders and a bounded child-process runner.
- [ ] Add FFmpeg to the Docker image only if the image-size/resource cost remains compatible with the free Render service; otherwise retain optional external/local FFmpeg execution and document it.
- [ ] Run focused and full tests.

### Task 3: Authenticated gateway and phone Studio surface

**Files:**
- Modify: `server.js`
- Modify: `mobile-release/index.html`
- Modify: `mobile-release/app.js`
- Modify: `mobile-release/styles.css`
- Modify: `.github/workflows/mobile-integration.yml`
- Test: `test/media-studio-http.test.mjs`

**Interfaces:**
- `POST /media-studio/inspect-srt` accepts JSON SRT text and returns parsed cues.
- `GET /media-studio/status` reports FFmpeg availability without exposing filesystem paths.
- All routes require the existing bearer token, rate limit, bounded body, no-store responses, and same-origin CSP.
- The phone view explains the pipeline and provides SRT inspection plus storyboard scene planning; media upload/render is enabled only when the bounded upload path and FFmpeg capability are present.

- [ ] Add unauthorized, malformed, oversized, and successful route tests.
- [ ] Verify expected red before implementation.
- [ ] Integrate routes without changing /orchestrate behavior or auth semantics.
- [ ] Add a mobile Studio navigation item and accessible view; do not request microphone permission for this feature.
- [ ] Add media-studio tests to CI and run all mobile integration checks.

### Task 4: Verification and handoff

**Files:**
- Modify: `README.md`
- Modify: `docs/MOBILE_COMPANION.md`

- [ ] Document the exact supported workflow, zero-cost boundaries, APK non-installation decision, FFmpeg requirement, and known limitations.
- [ ] Run `node --test test/*.test.mjs`, syntax checks, and the existing Docker build in CI.
- [ ] Inspect the branch diff and confirm no production deploy, merge, publish, secret, APK, or generated media was added.
- [ ] Report CI evidence, branch URL, completed capabilities, and blocked capabilities separately.
