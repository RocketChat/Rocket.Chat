import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { differenceInMilliseconds } from 'date-fns';
import { useCallback, useSyncExternalStore } from 'react';

import { getUserPreference } from './getUserPreference';
import { dispatchToastMessage } from './toast';
import { Messages, Subscriptions } from '../stores';
import { sdk } from './SDKClient';
import { onClientMessageReceived } from './onClientMessageReceived';
import { getUserId } from './user';
import { getConfig } from './utils/getConfig';
import { mapMessageFromApi } from './utils/mapMessageFromApi';

const processMessage = async (msg: IMessage & { ignored?: boolean }, { subscription }: { subscription?: ISubscription }) => {
	const userId = msg.u?._id;

	if (subscription?.ignored?.includes(userId)) {
		msg.ignored = true;
	}

	if (msg.t === 'e2e') {
		msg.e2e = 'pending';
	}

	return (await onClientMessageReceived(msg)) || msg;
};

export async function upsertMessage({ msg, subscription }: { msg: IMessage & { ignored?: boolean }; subscription?: ISubscription }) {
	Messages.state.store(await processMessage(msg, { subscription }));
}

export async function upsertMessageBulk({
	msgs,
	subscription,
}: {
	msgs: (IMessage & { ignored?: boolean })[];
	subscription?: ISubscription;
}) {
	const processedMsgs = await Promise.all(msgs.map(async (msg) => processMessage(msg, { subscription })));
	Messages.state.storeMany(processedMsgs);
}

const defaultLimit = parseInt(getConfig('roomListLimit') ?? '50') || 50;

export type RoomHistoryState = {
	hasMore: boolean;
	hasMoreNext: boolean;
	isLoading: boolean;
	unreadNotLoaded: number;
	firstUnread: IMessage | undefined;
	loaded: number | undefined;
	cursorPrevious?: string | null;
	cursorNext?: string | null;
	scroll?: {
		scrollHeight: number;
		scrollTop: number;
	};
};

const roomStateEvent = (rid: IRoom['_id']) => `state:${rid}` as const;

class RoomHistoryManagerClass extends Emitter {
	private lastRequest?: Date;

	private histories: Record<IRoom['_id'], RoomHistoryState> = {};

	// Bumped by `clear`/`close`. In-flight requests capture it at entry and discard their
	// response if it changed, so a page from a dead window can't touch the rebuilt one.
	private generations: Record<IRoom['_id'], number> = {};

	private requestsList: string[] = [];

	private generation(rid: IRoom['_id']): number {
		return this.generations[rid] ?? 0;
	}

	public getRoom(rid: IRoom['_id']): RoomHistoryState {
		if (!this.histories[rid]) {
			this.histories[rid] = {
				hasMore: true,
				hasMoreNext: false,
				isLoading: false,
				unreadNotLoaded: 0,
				firstUnread: undefined,
				loaded: undefined,
			};
		}

		return this.histories[rid];
	}

	public updateRoom(rid: IRoom['_id'], patch: Partial<RoomHistoryState>): void {
		const room = this.getRoom(rid);
		Object.assign(room, patch);
		this.emit(roomStateEvent(rid), room);
	}

	public subscribeToRoom(rid: IRoom['_id'], cb: (state: RoomHistoryState) => void): () => void {
		return this.on(roomStateEvent(rid), cb);
	}

	private async queue(): Promise<void> {
		return new Promise((resolve) => {
			const requestId = crypto.randomUUID();
			const done = () => {
				this.lastRequest = new Date();
				resolve();
			};
			if (this.requestsList.length === 0) {
				return this.run(done);
			}
			this.requestsList.push(requestId);
			this.once(requestId, done);
		});
	}

	private run(fn: () => void) {
		const difference = this.lastRequest ? differenceInMilliseconds(new Date(), this.lastRequest) : Infinity;
		// Original cooldown was 500ms which forced ~330ms wait on the second getMore call when a
		// user opens a room. Pagination throughput here is bounded by the loadHistory server
		// method itself, so a smaller client-side spacing is enough to avoid hammering.
		const minSpacingMs = 100;
		if (difference > minSpacingMs) {
			return fn();
		}
		return setTimeout(fn, minSpacingMs - difference);
	}

	public isLoaded(rid: IRoom['_id']) {
		const room = this.getRoom(rid);
		return room.loaded !== undefined;
	}

	private unqueue() {
		const requestId = this.requestsList.pop();
		if (!requestId) {
			return;
		}
		this.run(() => this.emit(requestId));
	}

	public async getMore(rid: IRoom['_id'], { limit = defaultLimit }: { limit?: number } = {}): Promise<void> {
		const room = this.getRoom(rid);

		if (room.hasMore !== true) {
			return;
		}

		const generation = this.generation(rid);

		try {
			this.updateRoom(rid, { isLoading: true });

			await this.queue();

			let ls = undefined;

			const subscription = Subscriptions.state.find((record) => record.rid === rid);
			if (subscription) {
				({ ls } = subscription);
			}

			const showThreadsInMainChannel = getUserPreference(getUserId(), 'showThreadsInMainChannel', false);

			const { cursorPrevious: previous } = room;

			const result = await sdk.rest.get('/v1/rooms.history', {
				roomId: rid,
				...(previous && { previous }),
				...(ls && { lastSeen: new Date(ls).toISOString() }),
				count: limit,
				showThreadMessages: showThreadsInMainChannel,
			});

			this.unqueue();

			if (generation !== this.generation(rid)) {
				return;
			}

			const messages = result.messages.map((msg) => mapMessageFromApi(msg));
			this.updateRoom(rid, {
				unreadNotLoaded: result.unreadNotLoaded ?? 0,
				firstUnread: result.firstUnread && mapMessageFromApi(result.firstUnread),
				cursorPrevious: result.cursor.previous,
				hasMore: result.cursor.previous !== null,
			});

			const wrapper = document.querySelector<HTMLElement>('.messages-box .wrapper [data-overlayscrollbars-viewport]');
			if (wrapper) {
				room.scroll = {
					scrollHeight: wrapper.scrollHeight,
					scrollTop: wrapper.scrollTop,
				};
			}

			await upsertMessageBulk({
				msgs: messages.filter((msg) => msg.t !== 'command'),
				subscription,
			});

			if (generation !== this.generation(rid)) {
				return;
			}

			this.emit('loaded-messages');

			if (!room.loaded) {
				room.loaded = 0;
			}

			const visibleMessages = messages.filter((msg) => msg.t !== 'command' && (!msg.tmid || showThreadsInMainChannel || msg.tshow));

			room.loaded += visibleMessages.length;

			// `count` bounds raw messages, so a whole page can render as nothing and stall the scroll.
			if (room.hasMore && visibleMessages.length === 0) {
				return this.getMore(rid);
			}

			this.emit('loaded-messages');
		} finally {
			// When stale, `clear` already reset the flag and the rebuild owns it now.
			if (generation === this.generation(rid)) {
				this.updateRoom(rid, { isLoading: false });
			}
		}
	}

	public restoreScroll(rid: IRoom['_id']) {
		const room = this.getRoom(rid);
		const wrapper = document.querySelector('.messages-box .wrapper [data-overlayscrollbars-viewport]');

		if (room.scroll === undefined) {
			return;
		}

		if (!wrapper) {
			return;
		}

		const heightDiff = wrapper.scrollHeight - (room.scroll.scrollHeight ?? NaN);
		wrapper.scrollTop = room.scroll.scrollTop + heightDiff;
		room.scroll = undefined;
	}

	public async getMoreNext(rid: IRoom['_id']) {
		const room = this.getRoom(rid);
		if (room.hasMoreNext !== true) {
			return;
		}

		const generation = this.generation(rid);

		try {
			this.updateRoom(rid, { isLoading: true });

			await this.queue();

			// `clear` may have run while queued (jump to message, jump to recent):
			// the window this cursor belonged to is gone, so there is nothing to page from.
			const { cursorNext: next } = room;
			if (!next) {
				return;
			}

			const subscription = Subscriptions.state.find((record) => record.rid === rid);
			const showThreadsInMainChannel = getUserPreference(getUserId(), 'showThreadsInMainChannel', false);

			const result = await sdk.rest.get('/v1/rooms.history', {
				roomId: rid,
				next,
				count: defaultLimit,
				showThreadMessages: showThreadsInMainChannel,
			});

			// The queued-cursor check above only covers a `clear` that ran before dispatch;
			// this one covers a `clear` that landed while the request was on the wire.
			if (generation !== this.generation(rid)) {
				return;
			}

			const messages = result.messages.map((msg) => mapMessageFromApi(msg));

			await upsertMessageBulk({
				msgs: messages.filter((msg) => msg.t !== 'command'),
				subscription,
			});

			if (generation !== this.generation(rid)) {
				return;
			}

			this.emit('loaded-messages');

			this.updateRoom(rid, {
				cursorNext: result.cursor.next,
				hasMoreNext: result.cursor.next !== null,
			});
			if (!room.loaded) {
				room.loaded = 0;
			}

			room.loaded += messages.length;
		} finally {
			if (generation === this.generation(rid)) {
				this.updateRoom(rid, { isLoading: false });
			}
			this.unqueue();
		}
	}

	public hasMore(rid: IRoom['_id']) {
		return this.getRoom(rid).hasMore;
	}

	public hasMoreNext(rid: IRoom['_id']) {
		return this.getRoom(rid).hasMoreNext;
	}

	public getMoreIfIsEmpty(rid: IRoom['_id']) {
		const room = this.getRoom(rid);

		if (room.loaded === undefined) {
			return this.getMore(rid);
		}
	}

	public isLoading(rid: IRoom['_id']) {
		return this.getRoom(rid).isLoading;
	}

	public close(rid: IRoom['_id']) {
		this.generations[rid] = this.generation(rid) + 1;
		Messages.state.remove((record) => record.rid === rid);
		delete this.histories[rid];
	}

	public clear(rid: IRoom['_id']) {
		this.generations[rid] = this.generation(rid) + 1;
		const room = this.getRoom(rid);
		Messages.state.remove((record) => record.rid === rid);
		room.loaded = undefined;
		this.updateRoom(rid, {
			isLoading: false,
			hasMore: true,
			hasMoreNext: false,
			cursorPrevious: undefined,
			cursorNext: undefined,
		});
		this.emit('room-cleared', rid);
	}

	public async getSurroundingMessages(message?: Pick<IMessage, '_id' | 'rid'> & { ts?: Date }) {
		return this.loadSurroundingMessages(message, true);
	}

	public async getSurroundingChannelMessages(message?: Pick<IMessage, '_id' | 'rid'> & { ts?: Date }) {
		return this.loadSurroundingMessages(message, false);
	}

	private async loadSurroundingMessages(message: (Pick<IMessage, '_id' | 'rid'> & { ts?: Date }) | undefined, showThreadMessages: boolean) {
		if (!message?.rid) {
			return;
		}

		const messageAlreadyLoaded = Messages.state.some((record) => record._id === message._id && record._hidden !== true);

		if (messageAlreadyLoaded) {
			return;
		}

		const room = this.getRoom(message.rid);
		this.updateRoom(message.rid, { isLoading: true });

		const subscription = Subscriptions.state.find((record) => record.rid === message.rid);

		let generation = this.generation(message.rid);

		try {
			const result = await sdk.rest.get('/v1/rooms.history', {
				roomId: message.rid,
				aroundId: message._id,
				count: defaultLimit,
				showThreadMessages,
			});

			// Rebuilds the window around the target, so the store does not grow monotonically here.
			this.clear(message.rid);

			// This rebuild owns the window created by its own `clear`; a later `clear`
			// (jump to recent, messagesImported) makes the rest of this flow stale.
			generation = this.generation(message.rid);

			// `clear` drops the cursors and clears `isLoading`, so restore the previous side before the
			// upsert yields: a `getMore` landing in that window has no cursor and would page from the
			// newest end instead.
			this.updateRoom(message.rid, {
				isLoading: true,
				cursorPrevious: result.cursor.previous,
				hasMore: result.cursor.previous !== null,
			});

			const messages = result.messages.map((msg) => mapMessageFromApi(msg));

			await upsertMessageBulk({ msgs: messages.filter((msg) => msg.t !== 'command'), subscription });

			if (generation !== this.generation(message.rid)) {
				return;
			}

			// The next side only lands after the upsert: `hasMoreNext` arms jump-to-recent
			// (useHasNewMessages), which would clear the store while the upsert is still pending.
			this.updateRoom(message.rid, {
				cursorNext: result.cursor.next,
				hasMoreNext: result.cursor.next !== null,
			});

			this.emit('loaded-messages');

			if (!room.loaded) {
				room.loaded = 0;
			}
			room.loaded += messages.length;
		} catch (error) {
			// The target may have been deleted since the link was created; no window to build then.
			if (error instanceof Response && error.status === 404) {
				return;
			}
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			if (generation === this.generation(message.rid)) {
				this.updateRoom(message.rid, { isLoading: false });
			}
		}
	}
}

export const RoomHistoryManager = new RoomHistoryManagerClass();

export const useRoomHistoryState = <T>(rid: IRoom['_id'], selector: (state: RoomHistoryState) => T): T =>
	useSyncExternalStore(
		useCallback((onStoreChange) => RoomHistoryManager.subscribeToRoom(rid, onStoreChange), [rid]),
		() => selector(RoomHistoryManager.getRoom(rid)),
	);
