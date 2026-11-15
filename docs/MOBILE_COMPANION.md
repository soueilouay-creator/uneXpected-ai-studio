# uneXpected Phone companion

This is an additive, same-origin installable PWA served at `/mobile/` by the existing uneXpected AI Studio gateway.

## Included

- Mobile chat that uses the existing authenticated `POST /orchestrate` endpoint.
- One-turn dictation and a voice-chat loop using browser speech recognition and speech synthesis, with English, French and Arabic language choices.
- Local projects, tasks, notes, chat history and an improvement proposal queue.
- Export/import workspace backup; the gateway bearer token is not exported.
- 40 v7.1 workflow profile references plus the two v7.1 workflow skill references. These are guidance/catalog references, not separate running agents.
- Optional per-request context sharing. It is off by default. Approved improvement ideas are sent only as planning context.
- Offline shell caching only. `/health`, `/orchestrate` and `/test-provider` are never cached.

## Install on Android

1. Open `https://unexpected-ai-studio.onrender.com/mobile/` in Chrome after deployment.
2. Use the browser menu and choose **Install app** or **Add to Home screen**.
3. Open Settings in the app and paste the existing `UNEXPECTED_ACCESS_TOKEN` value from your private Render environment. It is stored only in the current tab session; do not share it in chat.
4. Choose a workflow profile and AI route. OpenAI is the default route; selecting both may use additional provider credits.

Microphone and speech output depend on the browser and device language packs. Voice recognition may use the browser vendor's service and is not guaranteed to work offline. Offline mode supports local commands and stored workspace data, not general LLM inference.

## Security and boundary

The gateway retains its existing bearer authentication, rate limiting, request size limits and provider routing. The PWA calls the gateway same-origin; no permissive CORS policy or unauthenticated AI endpoint is added. No API provider call is made by the installation itself. A configured provider is not described as verified until a real, successful request is recorded.

Improvement proposals are stored locally. Approval in the app authorizes only planning context; it does not authorize code writes, protected instruction changes, commits, merges or deployments.


## Video Studio (feature branch)

The additive Video Studio view can inspect SRT timing and, when the gateway has FFmpeg plus FFprobe, export a vertical MP4 from user-selected media:
1. Paste an SRT whose first cue starts at zero and whose cues are contiguous. One to nine cues are supported, up to 120 seconds. The uploaded narration must cover the final cue; the gateway rejects an audio file more than 100 ms shorter than the SRT timeline.
2. Select a PNG/JPEG 3×3 storyboard image (maximum 8 MB).
3. Select a supported narration file (MP3, WAV, M4A/MP4, AAC, OGG or WebM; maximum 12 MB).
4. Leave **Trim long pauses** checked (or turn it off), check the render engine, then choose **Render MP4**. Pauses of at least 0.45 seconds are reduced while retaining 0.10 seconds at their edges; SRT timings are recalculated, and captions are kept at or above 0.25 seconds. The gateway splits the storyboard into scene images, assembles a 1080×1920 H.264/AAC video, embeds the adjusted SRT as a selectable subtitle track, and returns an MP4 download.

The gateway request is bearer-authenticated and bounded to 28 MB. Files are held in a private temporary workspace and the workspace is removed after the response. The gateway does not persist source media. The phone UI retains the access token in memory only.

**Runtime dependency:** FFmpeg and FFprobe must already exist in the server runtime. The current Docker image does not install them; the status endpoint reports this condition and the export endpoint returns an unavailable response rather than simulating an MP4. No production runtime has been changed or deployed from this feature branch.

Narration generation, audio enhancement, automatic clip selection, livestream monitoring and publishing are not included in this stage. Silence trimming is a conservative pause-reduction pass, not full audio mastering; always review the exported video. CI uses controlled fake FFmpeg/FFprobe binaries to verify the gateway workflow; it is not a substitute for a real encoded-media QA run.
