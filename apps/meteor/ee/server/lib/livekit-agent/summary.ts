import { GoogleGenAI } from '@google/genai';
import { Logger } from '@rocket.chat/logger';
import { VideoConference as VideoConferenceModel, Users as UsersModel } from '@rocket.chat/models';

import { FileUpload } from '../../../../app/file-upload/server';
import { sendFileMessage } from '../../../../app/file-upload/server/methods/sendFileMessage';
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
Bullet points. Include EVERY follow-up commitment, todo, task, or "we should do X" mentioned in the transcript, even if no specific person was named and even if no due date was given. Trigger phrases include but are not limited to: "todo", "task", "action item", "follow up", "let's add", "we need to", "I'll", "you should", "remember to", "make sure to", "create a ticket", "open an issue".

Format each item as: "@username — task — due date if mentioned".
- Use the username exactly as it appears in the transcript labels (e.g. \`@alice\`).
- If the task wasn't assigned to anyone, write "@unassigned" in place of the username — do NOT skip the item just because no owner was named.
- Omit the due date suffix if no date was mentioned.

If after a careful read NO follow-up commitments / todos / tasks were discussed at all, write "None".

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
// Upload the stitched transcript as a markdown file and post it as a thread
// reply under the call's "Call ongoing" block message. Returns the new
// message id, or undefined on failure (so the caller can still attempt the
// AI summary without bailing out).
const postTranscriptFile = async (params: {
	callId: string;
	rid: string;
	parentMessageId: string | undefined;
	endedAt: Date;
	authorId: string;
	transcript: string;
}): Promise<string | undefined> => {
	const { callId, rid, parentMessageId, endedAt, authorId, transcript } = params;
	const stamp = endedAt.toISOString().slice(0, 16).replace('T', ' ');
	// Prepend a UTF-8 BOM so browsers reliably auto-detect the encoding
	// even when the response Content-Type lacks an explicit charset (some
	// upload stores strip parameters). Without this the em-dash in the
	// header renders as `â€—` mojibake when the browser falls back to
	// Windows-1252 / Latin-1.
	const body = `# Call transcript — ${stamp}\n\n${transcript}\n`;
	const buffer = Buffer.from(body, 'utf8');
	const filename = `call-transcript-${callId}.md`;
	// `text/markdown; charset=utf-8` is the canonical MIME; the explicit
	// charset is the primary fix — the BOM above is belt-and-braces in
	// case downstream strips Content-Type parameters.
	const mime = 'text/markdown; charset=utf-8';
	try {
		const fileStore = FileUpload.getStore('Uploads');
		const upload = await fileStore.insert({ name: filename, size: buffer.length, type: mime, rid, userId: authorId } as any, buffer);
		const sent = await sendFileMessage(authorId, {
			roomId: rid,
			file: { _id: upload._id, name: filename, type: mime, size: buffer.length },
			msgData: {
				msg: 'Call transcript',
				...(parentMessageId && { tmid: parentMessageId }),
			},
		});
		// sendFileMessage's type annotation says Promise<boolean> but it
		// actually returns the message doc; route through unknown for the
		// id we need.
		return (sent as unknown as { _id?: string } | undefined)?._id;
	} catch (err) {
		logger.warn({ msg: 'failed to post transcript file', err, callId });
		return undefined;
	}
};

export const maybeGenerateSummary = async (callId: string): Promise<boolean> => {
	if (!settings.get<boolean>('VideoConf_LiveKit_Summary_Enabled')) return false;
	const apiKey = settings.get<string>('VideoConf_LiveKit_Agent_Gemini_Api_Key') || '';
	if (!apiKey) {
		logger.warn({ msg: 'summary enabled but no Gemini key; skipping', callId });
		return false;
	}

	const call = await VideoConferenceModel.findOneById(callId);
	if (!call) return false;
	if (call.summary?.messageId) return false; // already posted
	if (!call.transcript || call.transcript.length === 0) return false;
	if (!call.rid) return false;
	// Per-call opt-in. The transcript[] may exist because note-taking was on
	// for part of the call; that's enough to summarise what was captured.
	// We only require that someone *at some point* turned it on (so a never-
	// opted-in call doesn't get summarised even if the worker mis-posted).
	if (!call.transcription?.startedAt) return false;

	const adminId = call.createdBy?._id;
	const admin = adminId ? await UsersModel.findOneById(adminId) : null;
	if (!admin) {
		logger.warn({ msg: 'no admin/creator user to post summary as', callId });
		return false;
	}

	const sortedEntries = [...call.transcript]
		.map((e) => ({ ...e, startedAt: new Date(e.startedAt) }))
		.sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());

	const { transcript } = await stitchTranscript(sortedEntries);
	const model = settings.get<string>('VideoConf_LiveKit_Summary_Gemini_Model') || DEFAULT_MODEL;

	const startedAt = call.createdAt;
	const endedAt = call.endedAt || new Date();
	const duration = formatDuration(endedAt.getTime() - startedAt.getTime());
	const parentMessageId = call.messages?.started;

	// Post the raw transcript as a .md file FIRST — it's always available
	// (no AI call needed), so users get something useful in the thread even
	// if the Gemini summary subsequently fails or is retried later. Skip if
	// we've already uploaded it on a prior pass.
	let transcriptMessageId = call.summary?.transcriptMessageId;
	if (!transcriptMessageId) {
		transcriptMessageId = await postTranscriptFile({
			callId,
			rid: call.rid,
			parentMessageId,
			endedAt,
			authorId: admin._id,
			transcript,
		});
		if (transcriptMessageId) {
			// Persist immediately so a Gemini failure below + retry won't
			// re-upload the transcript.
			await VideoConferenceModel.setSummaryById(callId, { generatedAt: new Date(), transcriptMessageId });
		}
	}

	let body: string;
	try {
		body = await callGemini(model, apiKey, transcript);
	} catch (err) {
		logger.error({ msg: 'Gemini summary call failed', err, callId });
		return false;
	}

	const header = `**Call summary — ${endedAt.toISOString().slice(0, 16).replace('T', ' ')} (${duration})**`;
	const msg = `${header}\n\n${body}`;

	try {
		// Thread the summary under the call's "Call ongoing" block message
		// (same parent as the recording + transcript replies) so the channel
		// only shows the single call entry at top level; recording, summary
		// and transcript file all live inside its thread. Falls back to a
		// top-level post if the parent id is missing.
		const sent = await executeSendMessage(admin._id, {
			rid: call.rid,
			msg,
			...(parentMessageId && { tmid: parentMessageId }),
		} as any);
		await VideoConferenceModel.setSummaryById(callId, {
			generatedAt: new Date(),
			messageId: sent?._id,
			...(transcriptMessageId && { transcriptMessageId }),
		});
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
	if (!settings.get<boolean>('VideoConf_LiveKit_Summary_Enabled')) return;
	try {
		const calls = await VideoConferenceModel.findEndedAwaitingSummary();
		for (const call of calls) {
			await maybeGenerateSummary(call._id);
		}
	} catch (err) {
		logger.warn({ msg: 'generatePendingSummaries failed', err });
	}
};
