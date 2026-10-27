import type { IMessage } from '@rocket.chat/core-typings';
import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';

import type { SearchIndexCrawler } from './searchIndexCrawler';

/** An encrypted room to index, with the time of its last message: the most recent rooms are indexed first. */
export type SearchIndexRoom = { rid: string; lastActivityAt: number };

export type IdleSignal = {
	isIdle(): boolean;
	/** Calls the listener each time `isIdle` changes. Returns the function that removes it. */
	subscribe(listener: () => void): () => void;
};

/**
 * The idle state that `useIdleDetection` (`client/hooks/useIdleDetection.ts`) announces on the document for `id`. The user
 * counts as active until the first announcement.
 */
export const createDocumentIdleSignal = (
	id: string,
	target: Pick<Document, 'addEventListener' | 'removeEventListener'> = document,
): IdleSignal & { dispose(): void } => {
	let idle = false;
	const listeners = new Set<() => void>();

	const onChange = (event: Event) => {
		const next = (event as CustomEvent<{ isIdle?: boolean } | undefined>).detail?.isIdle === true;
		if (next === idle) return;
		idle = next;
		for (const listener of [...listeners]) listener();
	};
	target.addEventListener(`${id}_change`, onChange);

	return {
		isIdle: () => idle,
		subscribe(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		dispose() {
			target.removeEventListener(`${id}_change`, onChange);
			listeners.clear();
		},
	};
};

export type SearchIndexProgress = {
	status: 'stopped' | 'waiting-for-idle' | 'indexing' | 'backing-off' | 'done';
	rooms: number;
	/** Rooms whose history backfill is complete. */
	roomsDone: number;
	/** Messages indexed since `start`. */
	indexed: number;
	/** Messages that wait for their room key. */
	pendingDecrypt: number;
};

type SearchIndexSchedulerOptions = {
	crawler: Pick<
		SearchIndexCrawler,
		'backfillRoomPage' | 'catchUpRoomPage' | 'retryPendingDecrypt' | 'addPendingDecrypt' | 'getPendingDecrypt' | 'forgetRoom'
	>;
	backend: Pick<ISearchIndexBackend, 'getRoomState' | 'removeRoom'>;
	getRooms: () => SearchIndexRoom[];
	idle: IdleSignal;
	pauseMs?: number;
	backoffBaseMs?: number;
	backoffMaxMs?: number;
	random?: () => number;
	now?: () => number;
	onError?: (error: unknown) => void;
};

export type SearchIndexScheduler = {
	/** Starts indexing: a catch-up of every room, then the history backfill, one request at a time while the user is idle. */
	start(): void;
	/** Stops after the request in flight, if any. Resolves when that request has ended. */
	stop(): Promise<void>;
	/** Catches up every room again, for example after a reconnect. */
	requestCatchUp(): void;
	/** Indexes the messages of the room that waited for its room key. */
	retryPendingDecrypt(rid: string): void;
	/** Keeps a live message that failed to decrypt (room key missing) for the retry of its room. */
	addPendingDecrypt(message: IMessage): void;
	/**
	 * Stops indexing the room and removes its rows from the index, after the request in flight (if any) has written its
	 * page, so no page of the room lands after the remove.
	 */
	removeRoom(rid: string): Promise<void>;
	getProgress(): SearchIndexProgress;
	/** Calls the listener each time `getProgress` changes. Returns the function that removes it. */
	subscribe(listener: () => void): () => void;
};

/** The server's default REST rate limit for a route (`API_Enable_Rate_Limiter_Limit_Calls_Default` per `..._Time_Default`). */
const DEFAULT_RATE_LIMIT_CALLS = 10;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
/** The crawler uses at most this part of it, so the client's own `chat.syncMessages` calls keep their share. */
const RATE_LIMIT_SHARE = 0.5;
const DEFAULT_PAUSE_MS = DEFAULT_RATE_LIMIT_WINDOW_MS / (DEFAULT_RATE_LIMIT_CALLS * RATE_LIMIT_SHARE);

/** Attempts for an error that is not an HTTP answer (a network failure, or a bug that a retry does not fix). */
const MAX_ATTEMPTS_WITHOUT_STATUS = 3;

const NOT_ALLOWED = 'error-not-allowed';

/** An HTTP error as `fetch` reports it: the `Response`. */
type HttpErrorResponse = {
	status: number;
	headers?: { get(name: string): string | null };
	clone?(): { json(): Promise<unknown> };
};

type Failure = { kind: 'retry'; retryAfterMs?: number; limited: boolean } | { kind: 'room-gone' } | { kind: 'skip-room' };

type Job = { kind: 'catch-up' | 'backfill'; rid: string };

const isHttpErrorResponse = (error: unknown): error is HttpErrorResponse =>
	typeof error === 'object' && error !== null && typeof (error as { status?: unknown }).status === 'number';

const isNotAllowed = (body: unknown): boolean => {
	const { error, errorType } = (typeof body === 'object' && body !== null ? body : {}) as { error?: unknown; errorType?: unknown };
	return errorType === NOT_ALLOWED || error === NOT_ALLOWED;
};

const readJson = async (response: HttpErrorResponse): Promise<unknown> => {
	try {
		return await response.clone?.().json();
	} catch {
		return undefined;
	}
};

/** How long the server asks the client to wait: `Retry-After` (seconds or a date), or the Rocket.Chat `X-RateLimit-Reset` time. */
const retryAfterOf = (response: HttpErrorResponse, now: number): number | undefined => {
	const retryAfter = response.headers?.get('Retry-After');
	if (retryAfter) {
		const seconds = Number(retryAfter);
		if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
		const date = Date.parse(retryAfter);
		if (!Number.isNaN(date)) return Math.max(0, date - now);
	}

	const resetAt = Number(response.headers?.get('X-RateLimit-Reset'));
	if (resetAt > 0) return Math.max(0, resetAt - now);

	return undefined;
};

const classify = async (error: unknown, now: number): Promise<Failure> => {
	if (!isHttpErrorResponse(error)) {
		return isNotAllowed(error) ? { kind: 'room-gone' } : { kind: 'retry', limited: true };
	}
	if (error.status === 429 || error.status >= 500) {
		return { kind: 'retry', retryAfterMs: retryAfterOf(error, now), limited: false };
	}
	if (error.status === 403) return { kind: 'room-gone' };
	// The server answers a room that the user left (or was removed from) with 400 `error-not-allowed`.
	if (error.status === 400 && isNotAllowed(await readJson(error))) return { kind: 'room-gone' };
	return { kind: 'skip-room' };
};

/**
 * Drives the search index crawler in the background: catch-up first, then the history backfill one page per room in
 * turn, the most recently active rooms first. It sends one request at a time, only while the user is idle, and waits
 * between two requests. It backs off on rate limits and server errors, and removes a room the user can no longer read
 * from the index.
 */
export const createSearchIndexScheduler = ({
	crawler,
	backend,
	getRooms,
	idle,
	pauseMs = DEFAULT_PAUSE_MS,
	backoffBaseMs = 10_000,
	backoffMaxMs = 10 * 60_000,
	random = Math.random,
	now = Date.now,
	onError = () => undefined,
}: SearchIndexSchedulerOptions): SearchIndexScheduler => {
	let started = false;
	let generation = 0;
	let loop: Promise<void> = Promise.resolve();
	/** The crawler call that runs now, if any. */
	let inFlight: Promise<unknown> = Promise.resolve();

	const track = <T>(call: Promise<T>): Promise<T> => {
		inFlight = call.catch(() => undefined);
		return call;
	};
	let status: SearchIndexProgress['status'] = 'stopped';
	let indexed = 0;
	let consecutiveFailures = 0;
	let jobAttempts = 0;
	let retryJob: Job | undefined;

	const backfillDone = new Map<string, boolean>();
	const removedRooms = new Set<string>();
	const skippedRooms = new Set<string>();
	const catchUpPending = new Set<string>();
	const catchUpAfterBackfill = new Set<string>();
	const keyArrived = new Set<string>();
	let visitedThisPass = new Set<string>();

	const listeners = new Set<() => void>();
	let wakeUp: (() => void) | undefined;
	let cancelSleep: (() => void) | undefined;
	let unsubscribeIdle: (() => void) | undefined;

	const rooms = () =>
		getRooms()
			.filter(({ rid }) => !removedRooms.has(rid))
			.sort((a, b) => b.lastActivityAt - a.lastActivityAt);

	const computeProgress = (): SearchIndexProgress => {
		const current = rooms();
		return {
			status,
			rooms: current.length,
			roomsDone: current.filter(({ rid }) => backfillDone.get(rid) === true).length,
			indexed,
			pendingDecrypt: current.reduce((sum, { rid }) => sum + crawler.getPendingDecrypt(rid).length, 0),
		};
	};

	let progress = computeProgress();

	const publish = () => {
		progress = computeProgress();
		for (const listener of [...listeners]) listener();
	};

	const setStatus = (run: number, next: SearchIndexProgress['status']) => {
		if (run !== generation) return;
		status = next;
		publish();
	};

	const wake = () => {
		const resolve = wakeUp;
		wakeUp = undefined;
		resolve?.();
	};

	const waitForSignal = () =>
		new Promise<void>((resolve) => {
			wakeUp = resolve;
		});

	const sleep = (ms: number) =>
		new Promise<void>((resolve) => {
			const finish = () => {
				clearTimeout(timer);
				cancelSleep = undefined;
				resolve();
			};
			const timer = setTimeout(finish, ms);
			cancelSleep = finish;
		});

	const backoffDelay = (retryAfterMs?: number) => {
		const step = Math.min(backoffMaxMs, backoffBaseMs * 2 ** (consecutiveFailures - 1));
		const jittered = step / 2 + random() * (step / 2);
		return Math.round(Math.max(jittered, retryAfterMs ?? 0));
	};

	const loadBackfillStates = async () => {
		for (const { rid } of rooms()) {
			if (backfillDone.has(rid)) continue;
			backfillDone.set(rid, (await backend.getRoomState(rid))?.backfillDone === true);
		}
	};

	const pickJob = async (): Promise<Job | undefined> => {
		await loadBackfillStates();
		const active = rooms().filter(({ rid }) => !skippedRooms.has(rid));

		for (const { rid } of active) {
			if (!catchUpPending.has(rid)) continue;
			if ((await backend.getRoomState(rid))?.lastUpdate !== undefined) return { kind: 'catch-up', rid };
			catchUpPending.delete(rid);
		}

		const backfill = active.filter(({ rid }) => backfillDone.get(rid) === false);
		if (backfill.length) {
			let next = backfill.find(({ rid }) => !visitedThisPass.has(rid));
			if (!next) {
				visitedThisPass = new Set();
				next = backfill[0];
			}
			visitedThisPass.add(next.rid);
			return { kind: 'backfill', rid: next.rid };
		}

		// Catches up the rooms whose backfill finished, for the messages sent while it ran.
		if (catchUpAfterBackfill.size) {
			catchUpAfterBackfill.forEach((rid) => catchUpPending.add(rid));
			catchUpAfterBackfill.clear();
			return pickJob();
		}

		return undefined;
	};

	const runJob = async ({ kind, rid }: Job) => {
		// A job picked before `removeRoom` must not index the removed room again.
		if (removedRooms.has(rid)) return;
		if (kind === 'catch-up') {
			const result = await crawler.catchUpRoomPage(rid);
			indexed += result.indexed;
			if (result.done) catchUpPending.delete(rid);
			return;
		}

		const result = await crawler.backfillRoomPage(rid);
		indexed += result.indexed;
		if (result.done) {
			backfillDone.set(rid, true);
			catchUpAfterBackfill.add(rid);
		}
	};

	const removeRoom = async (rid: string) => {
		removedRooms.add(rid);
		catchUpPending.delete(rid);
		catchUpAfterBackfill.delete(rid);
		backfillDone.delete(rid);
		crawler.forgetRoom(rid);
		try {
			await backend.removeRoom(rid);
		} catch (error) {
			onError(error);
		}
	};

	/** Runs the job and returns how long to wait before the next request. */
	const attempt = async (run: number, job: Job): Promise<number> => {
		try {
			await track(runJob(job));
			consecutiveFailures = 0;
			jobAttempts = 0;
			publish();
			return pauseMs;
		} catch (error) {
			const failure = await classify(error, now());
			if (failure.kind === 'retry' && (!failure.limited || jobAttempts + 1 < MAX_ATTEMPTS_WITHOUT_STATUS)) {
				consecutiveFailures++;
				jobAttempts++;
				retryJob = job;
				setStatus(run, 'backing-off');
				return backoffDelay(failure.retryAfterMs);
			}

			jobAttempts = 0;
			if (failure.kind === 'room-gone') {
				await removeRoom(job.rid);
			} else {
				onError(error);
				skippedRooms.add(job.rid);
			}
			publish();
			return pauseMs;
		}
	};

	const indexRoomsWithNewKeys = async () => {
		for (const rid of [...keyArrived]) {
			keyArrived.delete(rid);
			if (removedRooms.has(rid)) continue;
			try {
				indexed += (await track(crawler.retryPendingDecrypt(rid))).indexed;
			} catch (error) {
				onError(error);
			}
			publish();
		}
	};

	const nextJob = async (): Promise<Job | undefined> => {
		const job = retryJob;
		retryJob = undefined;
		if (job && !removedRooms.has(job.rid)) return job;
		jobAttempts = 0;
		return pickJob();
	};

	const runLoop = async (run: number) => {
		while (run === generation) {
			try {
				await indexRoomsWithNewKeys();
				if (run !== generation) return;

				const job = await nextJob();
				if (run !== generation) return;

				if (!job) {
					setStatus(run, 'done');
					await waitForSignal();
					continue;
				}

				if (!idle.isIdle()) {
					retryJob = job;
					setStatus(run, 'waiting-for-idle');
					await waitForSignal();
					continue;
				}

				setStatus(run, 'indexing');
				const delay = await attempt(run, job);
				if (run !== generation) return;
				await sleep(delay);
			} catch (error) {
				onError(error);
				consecutiveFailures++;
				if (run !== generation) return;
				await sleep(backoffDelay());
			}
		}
	};

	const requestCatchUp = () => {
		for (const { rid } of rooms()) catchUpPending.add(rid);
		wake();
	};

	return {
		start() {
			if (started) {
				requestCatchUp();
				return;
			}
			started = true;
			generation++;
			const run = generation;
			indexed = 0;
			backfillDone.clear();
			removedRooms.clear();
			skippedRooms.clear();
			visitedThisPass = new Set();
			for (const { rid } of rooms()) catchUpPending.add(rid);
			unsubscribeIdle = idle.subscribe(wake);
			loop = loop.then(() => runLoop(run));
		},

		stop() {
			if (!started) return loop;
			started = false;
			generation++;
			retryJob = undefined;
			unsubscribeIdle?.();
			unsubscribeIdle = undefined;
			cancelSleep?.();
			wake();
			status = 'stopped';
			publish();
			return loop;
		},

		requestCatchUp,

		retryPendingDecrypt(rid) {
			keyArrived.add(rid);
			wake();
		},

		addPendingDecrypt(message) {
			if (!started || removedRooms.has(message.rid)) return;
			crawler.addPendingDecrypt(message);
			publish();
		},

		async removeRoom(rid) {
			removedRooms.add(rid);
			keyArrived.delete(rid);
			if (retryJob?.rid === rid) retryJob = undefined;
			await inFlight;
			await removeRoom(rid);
			publish();
		},

		getProgress: () => progress,

		subscribe(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
	};
};
