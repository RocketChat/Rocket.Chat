import type { IMessage } from '@rocket.chat/core-typings';
import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';

import type { SearchIndexCrawler } from './searchIndexCrawler';

export type SearchIndexRoom = { rid: string; lastActivityAt: number };

export type SearchIndexProgress = {
	status: 'stopped' | 'indexing' | 'backing-off' | 'done';
	rooms: number;
	roomsDone: number;
	roomsSkipped: number;
	indexed: number;
	pendingDecrypt: number;
};

type SearchIndexSchedulerOptions = {
	crawler: Pick<
		SearchIndexCrawler,
		'backfillRoomPage' | 'catchUpRoomPage' | 'retryPendingDecrypt' | 'addPendingDecrypt' | 'getPendingDecrypt' | 'forgetRoom'
	>;
	backend: Pick<ISearchIndexBackend, 'getRoomState' | 'removeRoom'>;
	getRooms: () => SearchIndexRoom[];
	pauseMs?: number;
	backoffBaseMs?: number;
	backoffMaxMs?: number;
	random?: () => number;
	now?: () => number;
	refreshMs?: number;
	onError?: (error: unknown) => void;
};

export type SearchIndexScheduler = {
	start(): void;
	/** Stop new work and wait for the active request to finish. */
	stop(): Promise<void>;
	requestCatchUp(rids?: string[]): void;
	retryPendingDecrypt(rid: string): void;
	addPendingDecrypt(message: IMessage): void;
	/** Remove the room after its active page finishes, so the page cannot restore removed rows. */
	removeRoom(rid: string): Promise<void>;
	getProgress(): SearchIndexProgress;
	subscribe(listener: () => void): () => void;
};

const DEFAULT_RATE_LIMIT_CALLS = 10;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_SHARE = 0.5;
export const DEFAULT_PAUSE_MS = DEFAULT_RATE_LIMIT_WINDOW_MS / (DEFAULT_RATE_LIMIT_CALLS * RATE_LIMIT_SHARE);
export const DEFAULT_BACKOFF_BASE_MS = 10_000;
export const DEFAULT_BACKOFF_MAX_MS = 10 * 60_000;
export const DEFAULT_REFRESH_MS = 5 * 60_000;
const MAX_ATTEMPTS_WITHOUT_STATUS = 3;
const NOT_ALLOWED = 'error-not-allowed';

type HttpErrorResponse = {
	status: number;
	headers?: { get(name: string): string | null };
	clone?(): { json(): Promise<unknown> };
};

type Failure = { kind: 'retry'; retryAfterMs?: number; limited: boolean } | { kind: 'room-gone' } | { kind: 'skip-room' };
type Job = { kind: 'catch-up' | 'backfill'; rid: string; waitForKey?: boolean };

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
	if (error.status === 400 && isNotAllowed(await readJson(error))) return { kind: 'room-gone' };
	return { kind: 'skip-room' };
};

/** Index one page at a time, with catch-up before backfill and retry delays after transient errors. */
export const createSearchIndexScheduler = ({
	crawler,
	backend,
	getRooms,
	pauseMs = DEFAULT_PAUSE_MS,
	backoffBaseMs = DEFAULT_BACKOFF_BASE_MS,
	backoffMaxMs = DEFAULT_BACKOFF_MAX_MS,
	random = Math.random,
	now = Date.now,
	refreshMs = DEFAULT_REFRESH_MS,
	onError = () => undefined,
}: SearchIndexSchedulerOptions): SearchIndexScheduler => {
	let started = false;
	let generation = 0;
	let loop: Promise<void> = Promise.resolve();
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
	const catchUpPending = new Map<string, symbol>();
	const catchUpInProgress = new Map<string, symbol>();
	const queueCatchUp = (rid: string) => catchUpPending.set(rid, Symbol());
	const catchUpAfterBackfill = new Set<string>();
	const keyArrived = new Set<string>();
	const waitingForKey = new Set<string>();
	const noKeyWait = new Set<string>();
	const seenActivity = new Map<string, number>();
	const absentAfterRemoval = new Set<string>();
	let visitedThisPass = new Set<string>();
	const listeners = new Set<() => void>();
	let wakeUp: (() => void) | undefined;
	let cancelSleep: (() => void) | undefined;

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
			roomsSkipped: current.filter(({ rid }) => skippedRooms.has(rid)).length,
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
	const waitForSignal = (ms: number) =>
		new Promise<void>((resolve) => {
			const finish = () => {
				clearTimeout(timer);
				wakeUp = undefined;
				resolve();
			};
			const timer = setTimeout(finish, ms);
			wakeUp = finish;
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
	const refreshRooms = () => {
		const listed = getRooms();
		const present = new Set(listed.map(({ rid }) => rid));
		for (const rid of removedRooms) {
			if (!present.has(rid)) {
				absentAfterRemoval.add(rid);
			} else if (absentAfterRemoval.has(rid)) {
				removedRooms.delete(rid);
				absentAfterRemoval.delete(rid);
				skippedRooms.delete(rid);
			}
		}
		for (const { rid, lastActivityAt } of listed) {
			if (removedRooms.has(rid)) continue;
			const seen = seenActivity.get(rid);
			seenActivity.set(rid, lastActivityAt);
			if (seen === undefined || lastActivityAt > seen) queueCatchUp(rid);
		}
	};
	const pickJob = async (): Promise<Job | undefined> => {
		await loadBackfillStates();
		const active = rooms().filter(({ rid }) => !skippedRooms.has(rid) && !waitingForKey.has(rid));
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
		if (catchUpAfterBackfill.size) {
			catchUpAfterBackfill.forEach((rid) => queueCatchUp(rid));
			catchUpAfterBackfill.clear();
			return pickJob();
		}
		const waiting = rooms().find(({ rid }) => waitingForKey.has(rid) && !skippedRooms.has(rid));
		if (waiting) {
			waitingForKey.delete(waiting.rid);
			noKeyWait.add(waiting.rid);
			const kind = catchUpPending.has(waiting.rid) ? 'catch-up' : 'backfill';
			return { kind, rid: waiting.rid, waitForKey: false };
		}
		return undefined;
	};
	const runJob = async ({ kind, rid, waitForKey: jobWaitsForKey = true }: Job) => {
		if (removedRooms.has(rid)) return;
		const options = { waitForKey: jobWaitsForKey && !noKeyWait.has(rid) };
		if (kind === 'catch-up' && !catchUpInProgress.has(rid)) {
			catchUpInProgress.set(rid, catchUpPending.get(rid) ?? Symbol());
		}
		const result = kind === 'catch-up' ? await crawler.catchUpRoomPage(rid, options) : await crawler.backfillRoomPage(rid, options);
		indexed += result.indexed;
		if (result.waitingForKey && !keyArrived.has(rid)) waitingForKey.add(rid);
		if (kind === 'catch-up') {
			if (result.done) {
				if (catchUpPending.get(rid) === catchUpInProgress.get(rid)) catchUpPending.delete(rid);
				catchUpInProgress.delete(rid);
			}
			return;
		}
		if (result.done) {
			backfillDone.set(rid, true);
			catchUpAfterBackfill.add(rid);
		}
	};
	const removeRoom = async (rid: string) => {
		removedRooms.add(rid);
		catchUpPending.delete(rid);
		catchUpInProgress.delete(rid);
		catchUpAfterBackfill.delete(rid);
		backfillDone.delete(rid);
		waitingForKey.delete(rid);
		noKeyWait.delete(rid);
		seenActivity.delete(rid);
		if (!getRooms().some((room) => room.rid === rid)) absentAfterRemoval.add(rid);
		crawler.forgetRoom(rid);
		try {
			await backend.removeRoom(rid);
		} catch (error) {
			onError(error);
		}
	};
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
	const indexRoomsWithNewKeys = async (run: number) => {
		for (const rid of [...keyArrived]) {
			if (run !== generation) return;
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
				await indexRoomsWithNewKeys(run);
				if (run !== generation) return;
				const job = await nextJob();
				if (run !== generation) return;
				if (!job) {
					setStatus(run, 'done');
					await waitForSignal(refreshMs);
					if (run !== generation) return;
					refreshRooms();
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
	const requestCatchUp = (rids?: string[]) => {
		const listed = rooms().map(({ rid }) => rid);
		for (const rid of rids ? listed.filter((listedRid) => rids.includes(listedRid)) : listed) queueCatchUp(rid);
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
			waitingForKey.clear();
			noKeyWait.clear();
			seenActivity.clear();
			absentAfterRemoval.clear();
			visitedThisPass = new Set();
			refreshRooms();
			loop = loop.then(() => runLoop(run));
		},
		stop() {
			if (!started) return loop;
			started = false;
			generation++;
			retryJob = undefined;
			cancelSleep?.();
			wake();
			status = 'stopped';
			publish();
			return loop;
		},
		requestCatchUp,
		retryPendingDecrypt(rid) {
			keyArrived.add(rid);
			waitingForKey.delete(rid);
			wake();
		},
		addPendingDecrypt(message) {
			if ((!started && generation > 0) || removedRooms.has(message.rid)) return;
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
