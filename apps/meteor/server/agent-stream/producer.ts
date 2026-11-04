import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';

import { applyBlockOps, closeOpenTask, coalesceOps } from './blockOps';
import type { BlockOp } from './blockOps';
import { replyScript } from './reply';
import type { ReplyStep } from './reply';
import { sendMessage } from '../lib/messages/sendMessage';
import { updateMessage } from '../lib/messages/updateMessage';

export type EndReason = 'done' | 'stopped' | 'error';

export type AgentDelta =
	| { t: 'patch'; streamId: string; seq: number; ops: BlockOp[]; ts: number }
	| { t: 'end'; streamId: string; seq: number; reason: EndReason; ts: number };

export type PatchDelta = Extract<AgentDelta, { t: 'patch' }>;
export type EndDelta = Extract<AgentDelta, { t: 'end' }>;

export type StreamContext = { streamId: string; room: IRoom; user: IUser };

/**
 * Carries the deltas of one stream to its viewers. The producer calls it in order and waits for each call to settle
 * before the next one, so a slow sink builds a queue instead of reordering. `blocks` is the reply after the delta. It is
 * the producer's live array: a sink that uses it after its first await clones it first.
 */
export type Sink = {
	start(placeholder: IMessage): Promise<void> | void;
	delta(delta: PatchDelta, blocks: unknown[]): Promise<void> | void;
	end(delta: EndDelta, blocks: unknown[]): Promise<void> | void;
};

export type SinkFactory = (context: StreamContext) => Sink;

export type StartOptions = {
	/** Coalescing window in ms. With 0 every token is one delta and nothing folds. */
	w: number;
	tokens: number;
	tokensPerSecond: number;
};

type Stream = StreamContext & {
	sink: Sink;
	placeholder?: IMessage;
	w: number;
	blocks: unknown[];
	seq: number;
	pending: BlockOp[];
	/** The tasks of the plan, those still in `pending` included. */
	tasks: number;
	flushTimer?: NodeJS.Timeout;
	tickTimer?: NodeJS.Timeout;
	queue: Promise<void>;
	ended: boolean;
};

const PLAN = 1;

const richText = (text: string) => ({ type: 'rich_text', elements: [{ type: 'rich_text_section', elements: [{ type: 'text', text }] }] });

const PLACEHOLDER_BLOCKS: unknown[] = [
	{ type: 'alert', level: 'info', text: { type: 'plain_text', text: 'The agent is working on your request.' } },
	{ type: 'plan', title: 'Fix the login bug', tasks: [{ task_id: 'step-0', title: 'Read the issue', status: 'in_progress' }] },
];

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
export const getSnapshot = (streamId: string): { blocks: unknown[]; seq: number; active: boolean } | undefined => {
	const stream = streams.get(streamId);
	return stream && { blocks: stream.blocks, seq: stream.seq, active: !stream.ended };
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
	if (!stream.pending.length) {
		return;
	}

	const ops = stream.w > 0 ? coalesceOps(stream.blocks, stream.pending) : stream.pending;
	stream.pending = [];
	const delta: PatchDelta = { t: 'patch', streamId: stream.streamId, seq: ++stream.seq, ops, ts: Date.now() };
	applyBlockOps(stream.blocks, ops);
	producerCounters.deltas++;

	const { blocks } = stream;
	void enqueue(stream, () => stream.sink.delta(delta, blocks));
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
			msg: '',
			blocks: stream.blocks,
			customFields: placeholder.customFields,
			streaming: { id: stream.streamId, state: delta.reason, seq: delta.seq, ts: delta.ts },
		} as Parameters<typeof updateMessage>[0],
		stream.user,
	);
};

/** Ends a stream: the viewers get the end delta, then one write persists the final blocks with the end state. */
export const endStream = (streamId: string, reason: EndReason): Promise<void> => {
	const stream = streams.get(streamId);
	if (!stream || stream.ended) {
		return Promise.resolve();
	}
	clearInterval(stream.tickTimer);
	flush(stream);
	stream.ended = true;
	closeOpenTask(stream.blocks, reason);

	const delta: EndDelta = { t: 'end', streamId, seq: ++stream.seq, reason, ts: Date.now() };
	const { blocks } = stream;
	void enqueue(stream, () => stream.sink.end(delta, blocks));
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

// the ops of a reply step, as the ops table of the plan lists them; indexes come from counters, not from `blocks`,
// because `blocks` lags behind while a window collects ops
const emitStep = (stream: Stream, step: ReplyStep): void => {
	const closeLast: BlockOp = { op: 'set', path: [PLAN, 'tasks', stream.tasks - 1, 'status'], value: 'complete' };
	const addTask = (task: Record<string, unknown>): BlockOp => ({
		op: 'append',
		path: [PLAN, 'tasks'],
		value: { task_id: `step-${stream.tasks++}`, status: 'in_progress', ...task },
	});

	if (step.kind === 'thinking') {
		if (step.first) {
			stream.pending.push(closeLast, addTask({ title: 'Thinking', details: richText('') }));
		}
		stream.pending.push({
			op: 'append',
			path: [PLAN, 'tasks', stream.tasks - 1, 'details', 'elements', 0, 'elements', 0, 'text'],
			value: step.text,
		});
	} else if (step.kind === 'tool') {
		stream.pending.push(closeLast, addTask({ title: step.title }));
	} else if (step.first) {
		stream.pending.push(closeLast, { op: 'append', path: [], value: { type: 'section', text: { type: 'mrkdwn', text: step.text } } });
	} else {
		stream.pending.push({ op: 'append', path: [PLACEHOLDER_BLOCKS.length, 'text', 'text'], value: step.text });
	}
};

const emitToken = (stream: Stream, step: ReplyStep): void => {
	emitStep(stream, step);
	if (stream.w === 0) {
		flush(stream);
		return;
	}
	stream.flushTimer ??= setTimeout(() => flush(stream), stream.w);
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
		w,
		blocks: structuredClone(PLACEHOLDER_BLOCKS),
		seq: 0,
		pending: [],
		tasks: 1,
		queue: Promise.resolve(),
		ended: false,
	};

	const placeholder = await sendMessage(
		user,
		{ msg: '', blocks: structuredClone(PLACEHOLDER_BLOCKS), streaming: { id: streamId, state: 'active', seq: 0, ts: Date.now() } },
		room,
	);
	if (!placeholder) {
		throw new Error('placeholder not sent');
	}
	stream.placeholder = placeholder;
	streams.set(streamId, stream);
	producerCounters.streamsStarted++;
	await stream.sink.start(placeholder);

	const reply = replyScript(tokens);
	const total = reply.filter((step) => step.kind !== 'tool').length;
	const startedAt = Date.now();
	let sent = 0;

	// emits every token that is due by the clock, so a late timer does not slow the reply down; the tool call takes no time
	let consumed = 0;
	stream.tickTimer = setInterval(() => {
		const due = Math.min(total, Math.floor(((Date.now() - startedAt) * tokensPerSecond) / 1000));
		while (sent < reply.length && (reply[sent].kind === 'tool' || consumed < due)) {
			consumed += reply[sent].kind === 'tool' ? 0 : 1;
			emitToken(stream, reply[sent++]);
		}
		if (sent === reply.length) {
			void endStream(streamId, 'done');
		}
	}, 1000 / tokensPerSecond);

	return { streamId, rid: room._id, mid: placeholder._id };
};

export const queuedSinkCalls = (): number => producerCounters.queued;
