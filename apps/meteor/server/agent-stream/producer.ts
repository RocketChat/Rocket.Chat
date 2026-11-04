import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';

import { replyTokens } from './reply';
import { sendMessage } from '../lib/messages/sendMessage';
import { updateMessage } from '../lib/messages/updateMessage';

export type EndReason = 'done' | 'stopped' | 'error';

export type AgentDelta =
	| { t: 'append'; streamId: string; seq: number; text: string; ts: number }
	| { t: 'end'; streamId: string; seq: number; reason: EndReason; ts: number };

export type AppendDelta = Extract<AgentDelta, { t: 'append' }>;
export type EndDelta = Extract<AgentDelta, { t: 'end' }>;

export type StreamContext = { streamId: string; room: IRoom; user: IUser };

/**
 * Carries the deltas of one stream to its viewers. The producer calls it in order and waits for each call to settle
 * before the next one, so a slow sink builds a queue instead of reordering. `text` is the reply after the delta.
 */
export type Sink = {
	start(placeholder: IMessage): Promise<void> | void;
	delta(delta: AppendDelta, text: string): Promise<void> | void;
	end(delta: EndDelta, text: string): Promise<void> | void;
};

export type SinkFactory = (context: StreamContext) => Sink;

export type StartOptions = {
	/** Coalescing window in ms. With 0 every token is one delta. */
	w: number;
	tokens: number;
	tokensPerSecond: number;
};

type Stream = StreamContext & {
	sink: Sink;
	placeholder?: IMessage;
	text: string;
	seq: number;
	buffer: string;
	flushTimer?: NodeJS.Timeout;
	tickTimer?: NodeJS.Timeout;
	queue: Promise<void>;
	ended: boolean;
};

const streams = new Map<string, Stream>();

export const producerCounters = {
	streamsStarted: 0,
	streamsEnded: 0,
	deltas: 0,
	queued: 0,
	sinkErrors: 0,
	lastError: '' as string,
};

export const resetProducerCounters = (): void => {
	Object.assign(producerCounters, { streamsStarted: 0, streamsEnded: 0, deltas: 0, sinkErrors: 0, lastError: '' });
};

export const activeStreamCount = (): number => [...streams.values()].filter((stream) => !stream.ended).length;

/** The producer's view of a stream, which a late or reconnecting viewer starts from. */
export const getSnapshot = (streamId: string): { text: string; seq: number; active: boolean } | undefined => {
	const stream = streams.get(streamId);
	return stream && { text: stream.text, seq: stream.seq, active: !stream.ended };
};

const enqueue = (stream: Stream, call: () => Promise<void> | void): Promise<void> => {
	producerCounters.queued++;
	stream.queue = stream.queue
		.then(call)
		.catch((err) => {
			producerCounters.sinkErrors++;
			producerCounters.lastError = String(err?.message ?? err);
		})
		.finally(() => {
			producerCounters.queued--;
		});
	return stream.queue;
};

const flush = (stream: Stream): void => {
	clearTimeout(stream.flushTimer);
	stream.flushTimer = undefined;
	if (!stream.buffer) {
		return;
	}

	const delta: AppendDelta = { t: 'append', streamId: stream.streamId, seq: ++stream.seq, text: stream.buffer, ts: Date.now() };
	stream.buffer = '';
	stream.text += delta.text;
	producerCounters.deltas++;

	const { text } = stream;
	void enqueue(stream, () => stream.sink.delta(delta, text));
};

const persistEnd = (stream: Stream, delta: EndDelta): Promise<void> => {
	const { placeholder } = stream;
	if (!placeholder) {
		return Promise.resolve();
	}
	return updateMessage(
		{
			_id: placeholder._id,
			rid: placeholder.rid,
			msg: stream.text,
			customFields: placeholder.customFields,
			streaming: { id: stream.streamId, state: delta.reason, seq: delta.seq, ts: delta.ts },
		} as Parameters<typeof updateMessage>[0],
		stream.user,
	);
};

/** Ends a stream: the viewers get the end delta, then one write persists the final text with the end state. */
export const endStream = (streamId: string, reason: EndReason): Promise<void> => {
	const stream = streams.get(streamId);
	if (!stream || stream.ended) {
		return Promise.resolve();
	}
	clearInterval(stream.tickTimer);
	flush(stream);
	stream.ended = true;

	const delta: EndDelta = { t: 'end', streamId, seq: ++stream.seq, reason, ts: Date.now() };
	const { text } = stream;
	void enqueue(stream, () => stream.sink.end(delta, text));
	return enqueue(stream, () => persistEnd(stream, delta)).finally(() => {
		producerCounters.streamsEnded++;
		streams.delete(streamId);
	});
};

/** Simulates a producer that dies: no end delta and no final write. */
export const killStream = (streamId: string): void => {
	const stream = streams.get(streamId);
	if (!stream) {
		return;
	}
	clearInterval(stream.tickTimer);
	clearTimeout(stream.flushTimer);
	stream.ended = true;
	streams.delete(streamId);
};

const emitToken = (stream: Stream, token: string, w: number): void => {
	stream.buffer += token;
	if (w === 0) {
		flush(stream);
		return;
	}
	stream.flushTimer ??= setTimeout(() => flush(stream), w);
};

/** Sends the placeholder message, then produces the fixed reply into the sink at a constant token rate. */
export const startStream = async (
	room: IRoom,
	user: IUser,
	createSink: SinkFactory,
	{ w, tokens, tokensPerSecond }: StartOptions,
): Promise<{ streamId: string; rid: string; mid: string }> => {
	const streamId = Random.id();
	const stream: Stream = {
		streamId,
		room,
		user,
		sink: createSink({ streamId, room, user }),
		text: '',
		seq: 0,
		buffer: '',
		queue: Promise.resolve(),
		ended: false,
	};

	const placeholder = await sendMessage(user, { msg: '', streaming: { id: streamId, state: 'active', seq: 0, ts: Date.now() } }, room);
	if (!placeholder) {
		throw new Error('placeholder not sent');
	}
	stream.placeholder = placeholder;
	streams.set(streamId, stream);
	producerCounters.streamsStarted++;
	await stream.sink.start(placeholder);

	const reply = replyTokens(tokens);
	const startedAt = Date.now();
	let sent = 0;

	// emits every token that is due by the clock, so a late timer does not slow the reply down
	stream.tickTimer = setInterval(() => {
		const due = Math.min(reply.length, Math.floor(((Date.now() - startedAt) * tokensPerSecond) / 1000));
		while (sent < due) {
			emitToken(stream, reply[sent++], w);
		}
		if (sent === reply.length) {
			void endStream(streamId, 'done');
		}
	}, 1000 / tokensPerSecond);

	return { streamId, rid: room._id, mid: placeholder._id };
};

export const queuedSinkCalls = (): number => producerCounters.queued;
