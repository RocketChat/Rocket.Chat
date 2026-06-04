/* eslint-disable */
/**
 * LiveKit transcription worker — runs as a subprocess of the Meteor server.
 *
 * Identical responsibilities to the previous standalone apps/livekit-agent
 * (auto-join every room, stream PCM into Gemini Live per remote speaker,
 * publish transcripts back on the LK data channel for live captions), plus
 * one new responsibility: POST every final transcript to the Meteor parent
 * via HTTP so the post-call summary has a persisted record to work from.
 *
 * Lives in private/ so Meteor's bundler ignores it (private/ is treated as
 * a static-assets directory). The supervisor at
 * ee/server/lib/livekit-agent/supervisor.ts forks this file with all the
 * settings-derived values as env vars.
 *
 * Env (all set by the supervisor):
 *   LIVEKIT_URL                 wss URL
 *   LIVEKIT_API_KEY             LK API key (the worker registers as a worker)
 *   LIVEKIT_API_SECRET          LK API secret
 *   GEMINI_API_KEY              Gemini API key
 *   GEMINI_LIVE_MODEL           optional model override
 *   STT_LANGUAGE_HINT           optional BCP-47 hint, e.g. "pt-BR"
 *   AGENT_IDENTITY              optional, default "transcription-agent"
 *   ROOM_NAME_PREFIX            optional filter, default "mc-"
 *   METEOR_BASE_URL             where to POST persistence requests
 *   METEOR_SHARED_SECRET        bearer token for the persistence endpoint
 */

import { GoogleGenAI, Modality } from '@google/genai';
import { AutoSubscribe, WorkerOptions, cli, defineAgent } from '@livekit/agents';
import { AudioStream, TrackKind } from '@livekit/rtc-node';

const log = (level, msg, extra) => {
	console.log(JSON.stringify({ ts: new Date().toISOString(), level, msg, ...extra }));
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
	throw new Error('GEMINI_API_KEY is required');
}

const GEMINI_LIVE_MODEL = process.env.GEMINI_LIVE_MODEL || 'gemini-3.1-flash-live-preview';
const LANGUAGE_HINT = process.env.STT_LANGUAGE_HINT || '';
const AGENT_IDENTITY = process.env.AGENT_IDENTITY || 'transcription-agent';
const ROOM_NAME_PREFIX = process.env.ROOM_NAME_PREFIX ?? 'mc-';
const METEOR_BASE_URL = process.env.METEOR_BASE_URL || '';
const METEOR_SHARED_SECRET = process.env.METEOR_SHARED_SECRET || '';

const TARGET_SAMPLE_RATE = 16000;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Best-effort POST of a finalized utterance to Meteor for persistence. Failures
 * are logged but never break the live caption stream — the summary is a nice
 * to have, captions are load-bearing.
 */
const postFinalTranscript = async (entry) => {
	if (!METEOR_BASE_URL || !METEOR_SHARED_SECRET) return;
	try {
		const res = await fetch(`${METEOR_BASE_URL.replace(/\/$/, '')}/api/v1/video-conference.livekit.transcript.append`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer lkagent:${METEOR_SHARED_SECRET}`,
			},
			body: JSON.stringify(entry),
		});
		if (!res.ok) {
			log('warn', 'transcript persist failed', { status: res.status, body: await res.text().catch(() => '') });
		}
	} catch (err) {
		log('warn', 'transcript persist threw', { err: String(err) });
	}
};

async function openLiveSession(callbacks, languageLabel) {
	// languageLabel takes precedence over the legacy STT_LANGUAGE_HINT env
	// var: it's the per-call choice broadcast by clients via the LK data
	// channel. When neither is set we fall back to "no instruction" so
	// Gemini auto-detects.
	const effectiveLang = languageLabel || LANGUAGE_HINT;
	const systemInstruction = effectiveLang
		? `You only transcribe input audio in ${effectiveLang}. Do not respond, do not summarise, do not analyse.`
		: 'You only transcribe input audio. Do not respond, do not summarise, do not analyse.';

	// Rolling buffer for the current turn's inputTranscription text. Gemini
	// Live sends multiple inputTranscription updates per turn (each contains
	// the full rolling transcription so far), then a turnComplete/
	// generationComplete to mark end-of-turn. We treat each update as
	// "interim" and the buffer-at-turnComplete as "final".
	let pendingTranscript = '';

	log('info', 'opening live session', { model: GEMINI_LIVE_MODEL });
	const session = await ai.live.connect({
		model: GEMINI_LIVE_MODEL,
		config: {
			responseModalities: [Modality.AUDIO],
			inputAudioTranscription: {},
			systemInstruction: { parts: [{ text: systemInstruction }] },
			realtimeInputConfig: {
				automaticActivityDetection: {
					silenceDurationMs: 600,
					prefixPaddingMs: 200,
				},
			},
		},
		callbacks: {
			onopen: () => log('info', 'live session open', { model: GEMINI_LIVE_MODEL }),
			onmessage: (msg) => {
				// (Diagnostic log removed — was useful when discovering the
				// shape but the model also emits dozens of `modelTurn`
				// audio chunks per turn that pollute the log.)
				// Each Gemini Live "turn" produces:
				//   1. one or more {serverContent: {inputTranscription: {text}}}
				//      with the rolling transcription of what the speaker said,
				//      WITHOUT any isFinal flag,
				//   2. a {serverContent: {turnComplete: true}} (or generationComplete)
				//      that marks the end of the turn.
				// We treat inputTranscription as interim while it streams and
				// emit a final on turnComplete using the last text we saw. The
				// API never sets `finished`/`isFinal`/`is_final` on the native-
				// audio model, so checking for those is futile.
				const sc = msg?.serverContent;
				const tx = sc?.inputTranscription;
				if (tx?.text) {
					pendingTranscript = tx.text;
					callbacks.onTranscript(pendingTranscript, false);
				}
				if ((sc?.turnComplete || sc?.generationComplete) && pendingTranscript) {
					log('info', 'transcript finalized', { text: pendingTranscript });
					callbacks.onTranscript(pendingTranscript, true);
					pendingTranscript = '';
				}
			},
			onerror: (err) => {
				log('warn', 'live session error', {
					message: err?.message ?? String(err),
					code: err?.code,
					reason: err?.reason,
				});
			},
			onclose: (ev) => {
				log('info', 'live session closed', { code: ev?.code, reason: ev?.reason, wasClean: ev?.wasClean });
				callbacks.onClose();
			},
		},
	});
	return session;
}

// Spawns a transcriber for a single track. Returns a controller with a
// `stop()` method so the supervisor (entry point) can tear it down when
// the last captions-request goes away or the participant leaves. The
// returned promise resolves after the audio loop exits cleanly.
function startTranscribeTrack(ctx, track, identity, languageLabel) {
	// Room name convention: `mc-<callId>`. If a room joined doesn't follow
	// the pattern we skip persistence but still stream captions on the
	// data channel — useful for non-Rocket.Chat LK projects sharing this
	// agent worker.
	const roomName = ctx.room.name || '';
	const callId = roomName.startsWith(ROOM_NAME_PREFIX) ? roomName.slice(ROOM_NAME_PREFIX.length) : null;
	log('info', 'starting transcription', { identity, callId, trackSid: track.sid });

	let closed = false;
	let utteranceStartedAt = null;
	let session = null;

	const stop = async () => {
		if (closed) return;
		closed = true;
		try {
			await session?.close();
		} catch (err) {
			log('warn', 'session close failed', { identity, err: String(err) });
		}
	};

	const done = (async () => {
		session = await openLiveSession(
			{
			onTranscript: (text, isFinal) => {
				const now = new Date();
				if (!utteranceStartedAt) utteranceStartedAt = now;

				const payload = JSON.stringify({
					type: 'transcript',
					participantId: identity,
					text,
					isFinal,
					ts: now.getTime(),
				});
				void ctx.room.localParticipant
					?.publishData(new TextEncoder().encode(payload), { reliable: false })
					.catch((err) => log('warn', 'publishData failed', { err: String(err) }));

				if (isFinal) {
					if (callId) {
						void postFinalTranscript({
							callId,
							participantId: identity,
							text,
							startedAt: utteranceStartedAt.toISOString(),
							endedAt: now.toISOString(),
						});
					}
					utteranceStartedAt = null;
				}
			},
			onClose: () => {
				closed = true;
			},
		},
			languageLabel,
		);

		const audioStream = new AudioStream(track, { sampleRate: TARGET_SAMPLE_RATE, numChannels: 1 });
		let framesSent = 0;
		const frameLog = setInterval(() => {
			log('info', 'audio frames pumped', { identity, framesSent });
		}, 30000);
		try {
			for await (const frame of audioStream) {
				if (closed) break;
				const data = Buffer.from(frame.data.buffer, frame.data.byteOffset, frame.data.byteLength);
				session.sendRealtimeInput({
					audio: { data: data.toString('base64'), mimeType: `audio/pcm;rate=${TARGET_SAMPLE_RATE}` },
				});
				framesSent += 1;
			}
		} catch (err) {
			log('warn', 'audio pump ended', { identity, err: String(err) });
		} finally {
			clearInterval(frameLog);
			closed = true;
			try {
				await session?.close();
			} catch (err) {
				log('warn', 'session close on exit failed', { identity, err: String(err) });
			}
		}
	})();

	return { stop, done };
}

export default defineAgent({
	entry: async (ctx) => {
		log('info', 'job received');
		await ctx.connect(undefined, AutoSubscribe.AUDIO_ONLY);
		log('info', 'agent connected', { room: ctx.room.name, model: GEMINI_LIVE_MODEL });

		if (ROOM_NAME_PREFIX && !ctx.room.name?.startsWith(ROOM_NAME_PREFIX)) {
			log('info', 'skipping non-matching room', { room: ctx.room.name, prefix: ROOM_NAME_PREFIX });
			try {
				await ctx.room.disconnect();
			} catch {
				/* already disconnecting */
			}
			return;
		}

		// Transcription is gated on TWO independent signals:
		//   - `captions-request` from any client (per-user: someone wants
		//     to see live captions). Ref-counted by identity.
		//   - `transcription-state` from any client (per-call: take-notes
		//     is on, the server is persisting finalized transcripts for
		//     the post-call summary). A boolean — last broadcast wins.
		// While EITHER is active we transcribe; when both go away we close
		// the Gemini sessions. `trackSubscribed` just caches the track
		// until one of those signals arrives.
		const captionRequesters = new Set();
		let transcriptionEnabled = false;
		// Current call language label, picked up from `call-language` data
		// channel broadcasts. Defaults to the legacy STT_LANGUAGE_HINT env
		// var (which the original deployment relied on) and falls back to
		// English (US) so the agent always has SOMETHING to feed Gemini.
		let currentLanguageLabel = LANGUAGE_HINT || 'English (US)';
		const subscribedAudio = new Map(); // identity -> track
		const activeTranscribers = new Map(); // identity -> { stop, done }

		const shouldTranscribe = () => captionRequesters.size > 0 || transcriptionEnabled;

		const ensureTranscriberForIdentity = (identity) => {
			if (activeTranscribers.has(identity)) return;
			const track = subscribedAudio.get(identity);
			if (!track) return;
			const ctrl = startTranscribeTrack(ctx, track, identity, currentLanguageLabel);
			activeTranscribers.set(identity, ctrl);
		};

		const startAllTranscribers = () => {
			for (const identity of subscribedAudio.keys()) {
				ensureTranscriberForIdentity(identity);
			}
		};

		const stopAllTranscribers = () => {
			for (const [, ctrl] of activeTranscribers) {
				void ctrl.stop();
			}
			activeTranscribers.clear();
		};

		const stopTranscriberFor = (identity) => {
			const ctrl = activeTranscribers.get(identity);
			if (ctrl) {
				void ctrl.stop();
				activeTranscribers.delete(identity);
			}
		};

		ctx.room.on('trackSubscribed', (track, _publication, participant) => {
			if (track.kind !== TrackKind.KIND_AUDIO) return;
			const identity = participant.identity;
			log('info', 'trackSubscribed', { kind: track.kind, identity });
			subscribedAudio.set(identity, track);
			// Only start transcribing if at least one of the two gates is
			// open. Otherwise the track sits cached and the transcriber
			// starts as soon as one is opened.
			if (shouldTranscribe()) ensureTranscriberForIdentity(identity);
		});

		ctx.room.on('trackUnsubscribed', (track, _publication, participant) => {
			if (track.kind !== TrackKind.KIND_AUDIO) return;
			const identity = participant.identity;
			subscribedAudio.delete(identity);
			stopTranscriberFor(identity);
		});

		ctx.room.on('participantDisconnected', (participant) => {
			const identity = participant.identity;
			subscribedAudio.delete(identity);
			stopTranscriberFor(identity);
			// Drop their captions-request too — without this a peer that
			// crashed mid-call would leave the requester set permanently
			// non-empty and we'd keep transcribing for nobody. Only stop
			// transcribers if BOTH gates are now closed.
			const wasIdle = !shouldTranscribe();
			captionRequesters.delete(identity);
			if (!wasIdle && !shouldTranscribe()) {
				log('info', 'last captions requester left; stopping transcribers');
				stopAllTranscribers();
			}
		});

		ctx.room.on('dataReceived', (payload, participant) => {
			if (!participant) return;
			let msg;
			try {
				msg = JSON.parse(new TextDecoder().decode(payload));
			} catch {
				return;
			}
			const identity = participant.identity;
			if (msg?.type === 'captions-request') {
				const wasIdle = !shouldTranscribe();
				if (msg.requested) {
					captionRequesters.add(identity);
				} else {
					captionRequesters.delete(identity);
				}
				if (wasIdle && shouldTranscribe()) {
					log('info', 'first captions requester; starting transcribers');
					startAllTranscribers();
				} else if (!wasIdle && !shouldTranscribe()) {
					log('info', 'last captions requester opted out; stopping transcribers');
					stopAllTranscribers();
				}
				return;
			}
			if (msg?.type === 'transcription-state') {
				const wasIdle = !shouldTranscribe();
				transcriptionEnabled = Boolean(msg.enabled);
				if (wasIdle && shouldTranscribe()) {
					log('info', 'take-notes enabled; starting transcribers');
					startAllTranscribers();
				} else if (!wasIdle && !shouldTranscribe()) {
					log('info', 'take-notes disabled and no caption requesters; stopping transcribers');
					stopAllTranscribers();
				}
				return;
			}
			if (msg?.type === 'call-language' && typeof msg.label === 'string' && msg.label) {
				if (msg.label === currentLanguageLabel) return;
				log('info', 'call language changed', { from: currentLanguageLabel, to: msg.label });
				currentLanguageLabel = msg.label;
				// Restart any active Gemini sessions with the new language —
				// `systemInstruction` is fixed at session creation. The gap
				// is ~one Gemini round-trip; acceptable for a deliberate
				// user action. Cached tracks pick up the new language the
				// moment transcription starts.
				if (activeTranscribers.size > 0) {
					stopAllTranscribers();
					if (shouldTranscribe()) startAllTranscribers();
				}
			}
		});
	},
});

if (import.meta.url === `file://${process.argv[1]}`) {
	cli.runApp(
		new WorkerOptions({
			agent: new URL(import.meta.url).pathname,
		}),
	);
}
