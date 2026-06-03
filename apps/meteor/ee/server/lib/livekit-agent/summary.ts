import { GoogleGenAI } from '@google/genai';
import { Logger } from '@rocket.chat/logger';
import { MediaCalls as MediaCallsModel, Users as UsersModel } from '@rocket.chat/models';

import { executeSendMessage } from '../../../../app/lib/server/methods/sendMessage';
import { settings } from '../../../../app/settings/server';

const logger = new Logger('MediaCalls/Summary');

const DEFAULT_MODEL = 'gemini-2.5-flash';

const SUMMARY_PROMPT = `You are summarizing a Rocket.Chat meeting transcript. Output four sections in markdown:

## Summary
Three to five sentences capturing the main thread of the discussion.

## Key decisions
Bullet points. Only include decisions the participants actually committed to. If none, write "None".

## Action items
Bullet points formatted "@username — task — due date if mentioned".
Use the username exactly as it appears in the transcript labels (e.g. \`@alice\`).
Omit the due date suffix if no date was mentioned.
If no action items were assigned, write "None".

## Participants
Comma-separated list of speakers as they appear in the transcript.

Keep tone neutral and factual; do not invent details that aren't in the transcript.`;

const formatDuration = (ms: number): string => {
	const total = Math.max(0, Math.round(ms / 1000));
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	if (h > 0) return `${h}h ${m}m`;
	if (m > 0) return `${m}m ${s}s`;
	return `${s}s`;
};

const stitchTranscript = async (
	entries: { participantId: string; text: string; startedAt: Date }[],
): Promise<{ transcript: string; usernamesById: Map<string, string> }> => {
	const uniqueIds = Array.from(new Set(entries.map((e) => e.participantId)));
	const usersById = new Map<string, string>();
	for (const id of uniqueIds) {
		const user = await UsersModel.findOneById(id, { projection: { username: 1, name: 1 } });
		if (user) usersById.set(id, user.username || user.name || id);
		else usersById.set(id, id);
	}

	const start = entries[0]?.startedAt?.getTime?.() ?? Date.now();
	const lines = entries.map((e) => {
		const offsetSec = Math.max(0, Math.round((e.startedAt.getTime() - start) / 1000));
		const mm = String(Math.floor(offsetSec / 60)).padStart(2, '0');
		const ss = String(offsetSec % 60).padStart(2, '0');
		const username = usersById.get(e.participantId) || e.participantId;
		return `[${mm}:${ss}] @${username}: ${e.text}`;
	});

	return { transcript: lines.join('\n'), usernamesById: usersById };
};

const isTransientGeminiError = (err: unknown): boolean => {
	const status = (err as any)?.status;
	if (status === 429 || status === 500 || status === 502 || status === 503 || status === 504) return true;
	const msg = String((err as Error)?.message || '').toLowerCase();
	return msg.includes('unavailable') || msg.includes('overloaded') || msg.includes('rate limit') || msg.includes('high demand');
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const callGemini = async (model: string, apiKey: string, transcript: string): Promise<string> => {
	const ai = new GoogleGenAI({ apiKey });
	const contents = `${SUMMARY_PROMPT}\n\nTranscript:\n---\n${transcript}\n---`;

	// Retry transient errors (503 "high demand", 429 rate-limit, etc.) with
	// exponential backoff: 2s → 5s → 15s. Fatal errors (4xx other than 429,
	// auth, bad request) bail immediately. After all retries we throw and
	// the caller leaves `summary.messageId` unset so the boot-time
	// generatePendingSummaries can retry on next restart.
	const delays = [2000, 5000, 15000];
	let lastErr: unknown;
	for (let attempt = 0; attempt <= delays.length; attempt += 1) {
		try {
			const res = await ai.models.generateContent({ model, contents });
			const text = (res as any)?.text || (res as any)?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || '').join('') || '';
			if (!text.trim()) throw new Error('Empty Gemini response');
			return text;
		} catch (err) {
			lastErr = err;
			if (!isTransientGeminiError(err) || attempt === delays.length) throw err;
			logger.info({ msg: 'Gemini transient error; retrying', attempt: attempt + 1, delayMs: delays[attempt] });
			await sleep(delays[attempt]);
		}
	}
	throw lastErr;
};

/**
 * Generate and post the post-call summary for the given call, if eligible.
 * Idempotent: sets `summary.messageId` after posting so re-runs (cron retry,
 * resume after restart) no-op. Returns true if a summary was posted, false
 * if skipped (already done, no transcript, summary disabled, etc.).
 */
export const maybeGenerateSummary = async (callId: string): Promise<boolean> => {
	if (!settings.get<boolean>('VoIP_TeamCollab_LiveKit_Summary_Enabled')) return false;
	const apiKey = settings.get<string>('VoIP_TeamCollab_LiveKit_Agent_Gemini_Api_Key') || '';
	if (!apiKey) {
		logger.warn({ msg: 'summary enabled but no Gemini key; skipping', callId });
		return false;
	}

	const call = await MediaCallsModel.findOneById(callId);
	if (!call) return false;
	if (call.summary?.messageId) return false; // already posted
	if (!call.transcript || call.transcript.length === 0) return false;
	if (!call.rid) return false;
	// Per-call opt-in. The transcript[] may exist because note-taking was on
	// for part of the call; that's enough to summarise what was captured.
	// We only require that someone *at some point* turned it on (so a never-
	// opted-in call doesn't get summarised even if the worker mis-posted).
	if (!call.transcription?.startedAt) return false;

	const adminId = call.createdBy?.id;
	const admin = adminId ? await UsersModel.findOneById(adminId) : null;
	if (!admin) {
		logger.warn({ msg: 'no admin/creator user to post summary as', callId });
		return false;
	}

	const sortedEntries = [...call.transcript]
		.map((e) => ({ ...e, startedAt: new Date(e.startedAt) }))
		.sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());

	const { transcript } = await stitchTranscript(sortedEntries);
	const model = settings.get<string>('VoIP_TeamCollab_LiveKit_Summary_Gemini_Model') || DEFAULT_MODEL;

	let body: string;
	try {
		body = await callGemini(model, apiKey, transcript);
	} catch (err) {
		logger.error({ msg: 'Gemini summary call failed', err, callId });
		return false;
	}

	const startedAt = call.activatedAt || call.createdAt;
	const endedAt = call.endedAt || new Date();
	const duration = formatDuration(endedAt.getTime() - startedAt.getTime());

	const header = `**Call summary — ${endedAt.toISOString().slice(0, 16).replace('T', ' ')} (${duration})**`;
	const msg = `${header}\n\n${body}`;

	try {
		const sent = await executeSendMessage(admin._id, { rid: call.rid, msg } as any);
		await MediaCallsModel.setSummaryById(callId, { generatedAt: new Date(), messageId: sent?._id });
		logger.info({ msg: 'summary posted', callId });
		return true;
	} catch (err) {
		logger.error({ msg: 'failed to post summary message', err, callId });
		return false;
	}
};

/**
 * Boot-time: pick up any ended calls that have transcripts but no summary
 * yet (e.g. server crashed between call-end and summary post). Mirrors the
 * pattern in recordingPoller's resumeActiveRecordingPollers.
 */
export const generatePendingSummaries = async (): Promise<void> => {
	if (!settings.get<boolean>('VoIP_TeamCollab_LiveKit_Summary_Enabled')) return;
	try {
		const calls = await MediaCallsModel.findEndedCallsAwaitingSummary();
		for (const call of calls) {
			await maybeGenerateSummary(call._id);
		}
	} catch (err) {
		logger.warn({ msg: 'generatePendingSummaries failed', err });
	}
};
