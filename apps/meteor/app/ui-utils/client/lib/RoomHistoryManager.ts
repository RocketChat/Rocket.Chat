import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { differenceInMilliseconds } from 'date-fns';
import { useCallback, useSyncExternalStore } from 'react';

import { onClientMessageReceived } from '../../../../client/lib/onClientMessageReceived';
import { getUserId } from '../../../../client/lib/user';
import { callWithErrorHandling } from '../../../../client/lib/utils/callWithErrorHandling';
import { getConfig } from '../../../../client/lib/utils/getConfig';
import { waitForElement } from '../../../../client/lib/utils/waitForElement';
import { Messages, Subscriptions } from '../../../../client/stores';
import { getUserPreference } from '../../../utils/client';

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
	oldestTs?: Date;
	scroll?: {
		scrollHeight: number;
		scrollTop: number;
	};
};

const roomStateEvent = (rid: IRoom['_id']) => `state:${rid}` as const;

class RoomHistoryManagerClass extends Emitter {
	private lastRequest?: Date;

	private histories: Record<IRoom['_id'], RoomHistoryState> = {};

	private requestsList: string[] = [];

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
		if (difference > 500) {
			return fn();
		}
		return setTimeout(fn, 500 - difference);
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

		try {
			this.updateRoom(rid, { isLoading: true });

			await this.queue();

			let ls = undefined;

			const subscription = Subscriptions.state.find((record) => record.rid === rid);
			if (subscription) {
				({ ls } = subscription);
			}

			const showThreadsInMainChannel = getUserPreference(getUserId(), 'showThreadsInMainChannel', false);
			const result = await callWithErrorHandling(
				'loadHistory',
				rid,
				room.oldestTs,
				limit,
				ls ? String(ls) : undefined,
				showThreadsInMainChannel,
			);

			if (!result) {
				throw new Error('loadHistory returned nothing');
			}

			this.unqueue();

			const { messages = [] } = result;
			this.updateRoom(rid, {
				unreadNotLoaded: result.unreadNotLoaded,
				firstUnread: result.firstUnread,
			});

			if (messages.length > 0) {
				room.oldestTs = messages[messages.length - 1].ts;
			}

			const wrapper = await waitForElement('.messages-box .wrapper [data-overlayscrollbars-viewport]');

			room.scroll = {
				scrollHeight: wrapper.scrollHeight,
				scrollTop: wrapper.scrollTop,
			};

			await upsertMessageBulk({
				msgs: messages.filter((msg) => msg.t !== 'command'),
				subscription,
			});

			this.emit('loaded-messages');

			if (!room.loaded) {
				room.loaded = 0;
			}

			const visibleMessages = messages.filter((msg) => !msg.tmid || showThreadsInMainChannel || msg.tshow);

			room.loaded += visibleMessages.length;

			if (messages.length < limit) {
				this.updateRoom(rid, { hasMore: false });
			}

			if (room.hasMore && (visibleMessages.length === 0 || room.loaded < limit)) {
				return this.getMore(rid);
			}

			this.emit('loaded-messages');
		} finally {
			this.updateRoom(rid, { isLoading: false });
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

		await this.queue();

		this.updateRoom(rid, { isLoading: true });

		const lastMessage = Messages.state.findFirst(
			(record) => record.rid === rid && record._hidden !== true,
			(a, b) => b.ts.getTime() - a.ts.getTime(),
		);

		const subscription = Subscriptions.state.find((record) => record.rid === rid);

		if (lastMessage?.ts) {
			const { ts } = lastMessage;
			const result = await callWithErrorHandling('loadNextMessages', rid, ts, defaultLimit);
			await upsertMessageBulk({
				msgs: Array.from(result.messages).filter((msg) => msg.t !== 'command'),
				subscription,
			});

			this.emit('loaded-messages');

			this.updateRoom(rid, { isLoading: false });
			if (!room.loaded) {
				room.loaded = 0;
			}

			room.loaded += result.messages.length;
			if (result.messages.length < defaultLimit) {
				this.updateRoom(rid, { hasMoreNext: false });
			}
		}
		this.unqueue();
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
		Messages.state.remove((record) => record.rid === rid);
		delete this.histories[rid];
	}

	public clear(rid: IRoom['_id']) {
		const room = this.getRoom(rid);
		Messages.state.remove((record) => record.rid === rid);
		room.oldestTs = undefined;
		room.loaded = undefined;
		this.updateRoom(rid, {
			isLoading: false,
			hasMore: true,
			hasMoreNext: false,
		});
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
		const result = await callWithErrorHandling('loadSurroundingMessages', message, defaultLimit, showThreadMessages);

		this.clear(message.rid);

		if (!result) {
			this.updateRoom(message.rid, { isLoading: false });
			return;
		}
		const { messages = [] } = result;

		if (messages.length > 0) {
			room.oldestTs = messages[messages.length - 1].ts;
		}

		await upsertMessageBulk({ msgs: Array.from(result.messages).filter((msg) => msg.t !== 'command'), subscription });

		this.emit('loaded-messages');
		this.updateRoom(message.rid, { isLoading: false });

		if (!room.loaded) {
			room.loaded = 0;
		}
		room.loaded += result.messages.length;
		this.updateRoom(message.rid, {
			hasMore: result.moreBefore,
			hasMoreNext: result.moreAfter,
		});
	}
}

export const RoomHistoryManager = new RoomHistoryManagerClass();

export const useRoomHistoryState = <T>(rid: IRoom['_id'], selector: (state: RoomHistoryState) => T): T =>
	useSyncExternalStore(
		useCallback((onStoreChange) => RoomHistoryManager.subscribeToRoom(rid, onStoreChange), [rid]),
		() => selector(RoomHistoryManager.getRoom(rid)),
	);
