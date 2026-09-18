# @rocket.chat/transcription-service

Core `transcription` service that transcribes voice-message audio attachments.

Responsibilities:

- Load and watch `AI_Voice_Transcription_*` settings
- Cap in-flight jobs (`AI_Voice_Transcription_Max_Concurrent_Jobs`)
- Fetch file bytes via `Upload.getFileBuffer`
- Run a pluggable engine from `@rocket.chat/ai-transcription`
- Persist `attachments.<i>.transcription` and broadcast `watch.messages`

The service is registered in-process in monolith mode and by
`ee/apps/transcription-service` in microservices mode.
