/**
 * LiveKit transcription agent for Rocket.Chat group calls, powered by the
 * Gemini Live API (Gemini 3 Flash Live by default).
 *
 * For each remote audio track we open a dedicated Live session with input
 * transcription enabled, downsample the LK PCM to 16 kHz mono, and stream
 * it in real time. The server emits incremental transcripts which we
 * publish back to the room over LK's data channel:
 *
 *   { "type": "transcript",
 *     "participantId": "<rocketchat user id>",
 *     "text": "…",
 *     "isFinal": true | false,
 *     "ts": <epoch ms> }
 *
 * The Rocket.Chat client (LiveKitMediaCallProvider) listens for these and
 * renders them as live captions on the speaker's tile.
 *
 * Environment variables:
 *   LIVEKIT_URL          wss URL of your LK Cloud project or self-hosted LK
 *   LIVEKIT_API_KEY      LK API key
 *   LIVEKIT_API_SECRET   LK API secret
 *   GEMINI_API_KEY       Gemini API key (https://aistudio.google.com/apikey)
 *   GEMINI_LIVE_MODEL    optional, default "gemini-3-flash-live"
 *   STT_LANGUAGE_HINT    optional BCP-47 hint, e.g. "pt-BR"
 *   AGENT_IDENTITY       optional, default "transcription-agent"
 */

import { config as loadDotenv } from 'dotenv';
import { GoogleGenAI, Modality } from '@google/genai';
import { AutoSubscribe, type JobContext, WorkerOptions, cli, defineAgent } from '@livekit/agents';
import { AudioStream, type RemoteAudioTrack, type RemoteParticipant, type RemoteTrack, TrackKind } from '@livekit/rtc-node';

loadDotenv();

const log = (level: 'info' | 'warn' | 'error', msg: string, extra?: Record<string, unknown>) => {
	console.log(JSON.stringify({ ts: new Date().toISOString(), level, msg, ...extra }));
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
	throw new Error('GEMINI_API_KEY is required');
}
// Default to a known-public Live model that supports bidiGenerateContent.
// Override via GEMINI_LIVE_MODEL when a newer one is GA on your project.
// Confirmed alternatives that accept the same config shape we use:
//   - gemini-2.0-flash-live-001         (GA, broadest availability)
//   - gemini-live-2.5-flash-preview     (preview tier, latest 2.5)
//   - gemini-2.5-flash-preview-native-audio-dialog
// The shorthand `gemini-3-flash-live` is NOT a Live endpoint name and will
// return a 1008 close on the websocket.
const GEMINI_LIVE_MODEL = process.env.GEMINI_LIVE_MODEL || 'gemini-3.1-flash-live-preview';
const LANGUAGE_HINT = process.env.STT_LANGUAGE_HINT || '';
const AGENT_IDENTITY = process.env.AGENT_IDENTITY || 'transcription-agent';

// Live API requires 16 kHz mono PCM input. LK's AudioStream can resample for
// us by passing sampleRate, which is much cleaner than rolling our own.
const TARGET_SAMPLE_RATE = 16000;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

type LiveCallbacks = {
	onTranscript: (text: string, isFinal: boolean) => void;
	onClose: () => void;
};

/**
 * Open a Live session configured for input-only transcription. We turn the
 * model's response modalities off as much as the API allows so we don't pay
 * latency or token cost for an assistant reply we'd just throw away.
 */
async function openLiveSession(callbacks: LiveCallbacks) {
	const systemInstruction = LANGUAGE_HINT
		? `You only transcribe input audio in ${LANGUAGE_HINT}. Do not respond, do not summarise, do not analyse.`
		: 'You only transcribe input audio. Do not respond, do not summarise, do not analyse.';

	log('info', 'opening live session', { model: GEMINI_LIVE_MODEL });
	const session = await ai.live.connect({
		model: GEMINI_LIVE_MODEL,
		config: {
			// Gemini 3 Flash Live (and other native-audio models) only accept
			// AUDIO as response modality — TEXT raises 1007 "combination not
			// supported". We don't actually want audio replies; we want the
			// input-transcription stream (which fires regardless of the
			// response modality). The systemInstruction below tells the
			// model to stay silent, and we ignore any audio it does emit.
			responseModalities: [Modality.AUDIO],
			inputAudioTranscription: {},
			systemInstruction: { parts: [{ text: systemInstruction }] },
		},
		callbacks: {
			onopen: () => log('info', 'live session open', { model: GEMINI_LIVE_MODEL }),
			onmessage: (msg: any) => {
				const tx = msg?.serverContent?.inputTranscription;
				if (!tx?.text) return;
				// The Live API sends rolling transcripts. `finished` (or
				// equivalent flag — name has shifted across SDK versions)
				// marks an utterance boundary; treat everything else as
				// interim so the UI can render it in the "in progress" style.
				const isFinal = Boolean(tx.finished ?? tx.isFinal ?? tx.is_final);
				callbacks.onTranscript(tx.text, isFinal);
			},
			onerror: (err: any) => {
				// Errors from the Live API often arrive as opaque ErrorEvent
				// objects. Pull every useful field we can to surface the
				// real reason (invalid model, bad config, auth, rate-limit).
				log('warn', 'live session error', {
					message: err?.message ?? String(err),
					code: err?.code,
					reason: err?.reason,
					raw: JSON.stringify(err, Object.getOwnPropertyNames(err ?? {})),
				});
			},
			onclose: (ev: any) => {
				log('info', 'live session closed', {
					code: ev?.code,
					reason: ev?.reason,
					wasClean: ev?.wasClean,
				});
				callbacks.onClose();
			},
		},
	});
	return session;
}

/**
 * Consume one remote audio track and pipe its samples (resampled to 16 kHz
 * mono by LK) into a Gemini Live session. Each transcript event is forwarded
 * to the whole room as a `transcript` data message keyed by the speaker's
 * participant identity.
 */
async function transcribeTrack(ctx: JobContext, track: RemoteAudioTrack, participant: RemoteParticipant): Promise<void> {
	const identity = participant.identity;
	log('info', 'starting transcription', { identity, trackSid: track.sid });

	let closed = false;
	const session = await openLiveSession({
		onTranscript: (text, isFinal) => {
			log('info', 'transcript', { identity, isFinal, text });
			const payload = JSON.stringify({
				type: 'transcript',
				participantId: identity,
				text,
				isFinal,
				ts: Date.now(),
			});
			void ctx.room.localParticipant?.publishData(new TextEncoder().encode(payload), { reliable: false }).catch((err) => {
				log('warn', 'publishData failed', { err: String(err) });
			});
		},
		onClose: () => {
			closed = true;
			log('info', 'live session closed', { identity });
		},
	});

	const audioStream = new AudioStream(track, { sampleRate: TARGET_SAMPLE_RATE, numChannels: 1 });
	try {
		for await (const frame of audioStream) {
			if (closed) break;
			const data = Buffer.from(frame.data.buffer, frame.data.byteOffset, frame.data.byteLength);
			session.sendRealtimeInput({
				audio: { data: data.toString('base64'), mimeType: `audio/pcm;rate=${TARGET_SAMPLE_RATE}` },
			});
		}
	} catch (err) {
		log('warn', 'audio pump ended', { identity, err: String(err) });
	} finally {
		try {
			await session.close();
		} catch (err) {
			log('warn', 'session close failed', { identity, err: String(err) });
		}
	}
	log('info', 'transcription ended', { identity });
}

// Optional room-name filter. Rocket.Chat group calls always use room names
// of `mc-<callId>`; set this if you share this LK project with anything else.
// Empty string = no filter, transcribe every dispatched room.
const ROOM_NAME_PREFIX = process.env.ROOM_NAME_PREFIX || '';

export default defineAgent({
	entry: async (ctx: JobContext) => {
		log('info', 'job received');

		// `ctx.room.name` is only populated after connect() — checking it
		// before would always return empty and we'd reject every job.
		// AUDIO_ONLY: video is irrelevant for STT and saves bandwidth.
		// IMPORTANT: connect takes POSITIONAL args (e2ee, autoSubscribe,
		// rtcConfig). Passing an options object would land in the `e2ee`
		// slot and the SDK would try to encode it as a malformed
		// E2eeOptions proto, failing with "encryption_type required field
		// not set". Pass `undefined` for e2ee to opt out.
		await ctx.connect(undefined, AutoSubscribe.AUDIO_ONLY);
		log('info', 'agent connected', { room: ctx.room.name, model: GEMINI_LIVE_MODEL });

		if (ROOM_NAME_PREFIX && !ctx.room.name?.startsWith(ROOM_NAME_PREFIX)) {
			log('info', 'skipping non-matching room (post-connect)', { room: ctx.room.name, prefix: ROOM_NAME_PREFIX });
			try {
				await ctx.room.disconnect();
			} catch {
				// already disconnecting
			}
			return;
		}

		ctx.room.on('trackSubscribed', (track: RemoteTrack, _publication, participant: RemoteParticipant) => {
			log('info', 'trackSubscribed', { kind: track.kind, identity: participant.identity });
			if (track.kind !== TrackKind.KIND_AUDIO) return;
			void transcribeTrack(ctx, track as RemoteAudioTrack, participant);
		});
	},
});

if (import.meta.url === `file://${process.argv[1]}`) {
	cli.runApp(
		new WorkerOptions({
			agent: new URL('./agent.ts', import.meta.url).pathname,
			// NOTE: deliberately NOT setting `agentName` here. A named worker
			// is opt-in dispatch — LK Cloud only sends it to rooms that
			// explicitly request the agent by name (via dispatch rules or in
			// the access token's room config). Leaving it unnamed makes this
			// an "ambient" worker that auto-attaches to every room in the
			// project. That's what we want for "transcribe all group calls
			// automatically." If you run this LK project for other purposes
			// too and need to scope the agent, re-enable the name AND add a
			// dispatch rule in LK Cloud → Project Settings → Agents.
		}),
	);
}
