import { Readable } from 'node:stream';

import EJSON from 'ejson';
import type { Msg, NatsConnection, Subscription } from 'nats';
import { Empty, createInbox, headers } from 'nats';

/**
 * A `Readable` cannot be serialised, so it never travels inside the payload of a
 * call. It is replaced by the subject a chunk server is listening on, and the far
 * side rebuilds a `Readable` that pulls one chunk per request from that subject.
 *
 * Pulling - rather than the sender publishing as fast as it reads - is what gives
 * backpressure, and it removes the subscribe/publish race: the consumer only ever
 * asks for a chunk after its own subscription is in place.
 */
const STREAM_MARKER = '__rcStream';

const STATUS_HEADER = 'rc-stream-status';
const STATUS_END = 'end';
const STATUS_ERROR = 'error';

/** Well under the nats `max_payload`, which defaults to 1MB and also has to fit the headers. */
const CHUNK_SIZE = 256 * 1024;

const TE = new TextEncoder();
const TD = new TextDecoder();

type StreamMarker = { [STREAM_MARKER]: string };

function isReadableStream(value: unknown): value is Readable {
	const candidate = value as Readable | undefined;

	return typeof candidate?.pipe === 'function' && typeof candidate?.read === 'function' && typeof candidate?.on === 'function';
}

/** Anything else - a `Date`, a `Uint8Array`, a class instance - is left to EJSON as is. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	const proto = Object.getPrototypeOf(value);

	return proto === Object.prototype || proto === null;
}

function isStreamMarker(value: unknown): value is StreamMarker {
	return isPlainObject(value) && typeof value[STREAM_MARKER] === 'string';
}

function statusHeaders(status: string): { headers: ReturnType<typeof headers> } {
	const hdrs = headers();
	hdrs.set(STATUS_HEADER, status);

	return { headers: hdrs };
}

/** Stream failures do not need `MeteorError` fidelity, so this stays independent of the broker's error codec. */
function encodeStreamError(e: unknown): Uint8Array {
	const { message, stack } = e instanceof Error ? e : new Error(String(e));

	return TE.encode(EJSON.stringify({ message, stack }));
}

function decodeStreamError(data: Uint8Array): Error {
	const plain = data.length ? EJSON.parse(TD.decode(data)) : undefined;

	const error = new Error(plain?.message ?? 'stream failed');
	if (plain?.stack) {
		error.stack = plain.stack;
	}

	return error;
}

/** Splits whatever the source emits into pieces a single nats message can carry. */
async function* toChunks(stream: Readable): AsyncGenerator<Uint8Array> {
	for await (const chunk of stream) {
		const bytes: Uint8Array =
			typeof chunk === 'string' ? TE.encode(chunk) : new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);

		for (let offset = 0; offset < bytes.byteLength; offset += CHUNK_SIZE) {
			yield bytes.subarray(offset, offset + CHUNK_SIZE);
		}
	}
}

function serveStream(nc: NatsConnection, stream: Readable, idleTimeout: number): string {
	const subject = createInbox();
	const chunks = toChunks(stream)[Symbol.asyncIterator]();

	let subscription: Subscription | undefined;
	let idle: NodeJS.Timeout | undefined;

	const close = (reason?: Error): void => {
		clearTimeout(idle);
		idle = undefined;
		subscription?.unsubscribe();

		if (reason) {
			stream.destroy(reason);
		}
	};

	/**
	 * A consumer can disappear without ever draining - its process dies, or the call
	 * it was an argument to failed before the handler read anything. Without this the
	 * subscription and the source stream would stay alive for the life of the process.
	 */
	const armIdleTimer = (): void => {
		clearTimeout(idle);
		idle = setTimeout(() => close(new Error('stream consumer timed out')), idleTimeout);
		idle.unref?.();
	};

	// requests are answered one at a time, so a consumer that pipelines cannot
	// interleave two `next()` calls on the same iterator
	let queue = Promise.resolve();

	subscription = nc.subscribe(subject, {
		callback: (_error, msg): void => {
			armIdleTimer();

			queue = queue.then(async () => {
				try {
					const { value, done } = await chunks.next();

					if (done) {
						msg.respond(Empty, statusHeaders(STATUS_END));
						close();
						return;
					}

					msg.respond(value);
				} catch (e) {
					msg.respond(encodeStreamError(e), statusHeaders(STATUS_ERROR));
					close();
				}
			});
		},
	});

	armIdleTimer();

	return subject;
}

function consumeStream(nc: NatsConnection, subject: string, timeout: number): Readable {
	return new Readable({
		// node will not call `read` again until a `push` lands, which is what keeps a
		// single chunk in flight without any explicit gate
		read(): void {
			void (async (): Promise<void> => {
				try {
					const msg: Msg = await nc.request(subject, Empty, { timeout });
					const status = msg.headers?.get(STATUS_HEADER);

					if (status === STATUS_END) {
						this.push(null);
						return;
					}

					if (status === STATUS_ERROR) {
						this.destroy(decodeStreamError(msg.data));
						return;
					}

					this.push(Buffer.from(msg.data));
				} catch (e) {
					this.destroy(e as Error);
				}
			})();
		},
	});
}

function mapPayload(value: unknown, map: (value: unknown) => unknown | undefined): unknown {
	const replacement = map(value);
	if (replacement !== undefined) {
		return replacement;
	}

	if (Array.isArray(value)) {
		let changed = false;
		const mapped = value.map((entry) => {
			const next = mapPayload(entry, map);
			changed ||= next !== entry;

			return next;
		});

		return changed ? mapped : value;
	}

	if (isPlainObject(value)) {
		let changed = false;
		const mapped: Record<string, unknown> = {};

		for (const [key, entry] of Object.entries(value)) {
			const next = mapPayload(entry, map);
			changed ||= next !== entry;
			mapped[key] = next;
		}

		return changed ? mapped : value;
	}

	return value;
}

/** Replaces every stream in an outgoing payload with the subject serving its chunks. */
export function serveStreams(nc: NatsConnection, value: unknown, idleTimeout: number): unknown {
	return mapPayload(value, (entry) => (isReadableStream(entry) ? { [STREAM_MARKER]: serveStream(nc, entry, idleTimeout) } : undefined));
}

/** Rebuilds a `Readable` for every subject an incoming payload points at. */
export function consumeStreams(nc: NatsConnection, value: unknown, timeout: number): unknown {
	return mapPayload(value, (entry) => (isStreamMarker(entry) ? consumeStream(nc, entry[STREAM_MARKER], timeout) : undefined));
}
