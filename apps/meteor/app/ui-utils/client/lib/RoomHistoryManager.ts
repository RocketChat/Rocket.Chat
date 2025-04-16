import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import differenceInMilliseconds from 'date-fns/differenceInMilliseconds';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import type { MutableRefObject } from 'react';
import { v4 as uuidv4 } from 'uuid';

import type { MinimongoCollection } from '../../../../client/definitions/MinimongoCollection';
import { onClientMessageReceived } from '../../../../client/lib/onClientMessageReceived';
import { callWithErrorHandling } from '../../../../client/lib/utils/callWithErrorHandling';
import { getConfig } from '../../../../client/lib/utils/getConfig';
import { waitForElement } from '../../../../client/lib/utils/waitForElement';
import { Messages, Subscriptions } from '../../../models/client';
import { getUserPreference } from '../../../utils/client';

export async function upsertMessage(
	{
		msg,
		subscription,
	}: {
		msg: IMessage & { ignored?: boolean };
		subscription?: ISubscription;
	},
	collection: MinimongoCollection<IMessage> = Messages,
) {
	const userId = msg.u?._id;

	if (subscription?.ignored?.includes(userId)) {
		msg.ignored = true;
	}

	if (msg.t === 'e2e' && !msg.file) {
		msg.e2e = 'pending';
	}
	msg = (await onClientMessageReceived(msg)) || msg;

	const { _id } = msg;

	return collection.upsert({ _id }, msg);
}

export function upsertMessageBulk(
	{ msgs, subscription }: { msgs: IMessage[]; subscription?: ISubscription },
	collection: MinimongoCollection<IMessage> = Messages,
) {
	const { queries } = collection;
	collection.queries = [];
	msgs.forEach((msg, index) => {
		if (index === msgs.length - 1) {
			collection.queries = queries;
		}
		void upsertMessage({ msg, subscription }, collection);
	});
}

const defaultLimit = parseInt(getConfig('roomListLimit') ?? '50') || 50;

class RoomHistoryManagerClass extends Emitter {
	private lastRequest?: Date;

	private histories: Record<
		IRoom['_id'],
		{
			hasMore: ReactiveVar<boolean>;
			hasMoreNext: ReactiveVar<boolean>;
			isLoading: ReactiveVar<boolean>;
			unreadNotLoaded: ReactiveVar<number>;
			firstUnread: ReactiveVar<IMessage | undefined>;
			loaded: number | undefined;
			oldestTs?: Date;
		}
	> = {};

	private requestsList: string[] = [];

	public getRoom(rid: IRoom['_id']) {
		if (!this.histories[rid]) {
			this.histories[rid] = {
				hasMore: new ReactiveVar(true),
				hasMoreNext: new ReactiveVar(false),
				isLoading: new ReactiveVar(false),
				unreadNotLoaded: new ReactiveVar(0),
				firstUnread: new ReactiveVar(undefined),
				loaded: undefined,
			};
		}

		return this.histories[rid];
	}

	private async queue(): Promise<void> {
		return new Promise((resolve) => {
			const requestId = uuidv4();
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

	private unqueue() {
		const requestId = this.requestsList.pop();
		if (!requestId) {
			return;
		}
		this.run(() => this.emit(requestId));
	}

	public async getMore(rid: IRoom['_id'], limit = defaultLimit): Promise<void> {
		const room = this.getRoom(rid);

		if (Tracker.nonreactive(() => room.hasMore.get()) !== true) {
			return;
		}

		room.isLoading.set(true);

		await this.queue();

		let ls = undefined;

		const subscription = Subscriptions.findOne({ rid });
		if (subscription) {
			({ ls } = subscription);
		}

		const showThreadsInMainChannel = getUserPreference(Meteor.userId(), 'showThreadsInMainChannel', false);
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
		room.unreadNotLoaded.set(result.unreadNotLoaded);
		room.firstUnread.set(result.firstUnread);

		if (messages.length > 0) {
			room.oldestTs = messages[messages.length - 1].ts;
		}

		await waitForElement('.messages-box .wrapper [data-overlayscrollbars-viewport]');

		upsertMessageBulk({
			msgs: messages.filter((msg) => msg.t !== 'command'),
			subscription,
		});

		if (!room.loaded) {
			room.loaded = 0;
		}

		const visibleMessages = messages.filter((msg) => !msg.tmid || showThreadsInMainChannel || msg.tshow);

		room.loaded += visibleMessages.length;

		if (messages.length < limit) {
			room.hasMore.set(false);
		}

		if (room.hasMore.get() && (visibleMessages.length === 0 || room.loaded < limit)) {
			return this.getMore(rid);
		}

		room.isLoading.set(false);
	}

	public async getMoreNext(rid: IRoom['_id'], atBottomRef: MutableRefObject<boolean>) {
		const room = this.getRoom(rid);
		if (Tracker.nonreactive(() => room.hasMoreNext.get()) !== true) {
			return;
		}

		await this.queue();
		atBottomRef.current = false;

		room.isLoading.set(true);

		const lastMessage = Messages.findOne({ rid, _hidden: { $ne: true } }, { sort: { ts: -1 } });

		const subscription = Subscriptions.findOne({ rid });

		if (lastMessage?.ts) {
			const { ts } = lastMessage;
			const result = await callWithErrorHandling('loadNextMessages', rid, ts, defaultLimit);
			upsertMessageBulk({
				msgs: Array.from(result.messages).filter((msg) => msg.t !== 'command'),
				subscription,
			});

			room.isLoading.set(false);
			if (!room.loaded) {
				room.loaded = 0;
			}

			room.loaded += result.messages.length;
			if (result.messages.length < defaultLimit) {
				room.hasMoreNext.set(false);
			}
		}
		this.unqueue();
	}

	public hasMore(rid: IRoom['_id']) {
		const room = this.getRoom(rid);
		return room.hasMore.get();
	}

	public hasMoreNext(rid: IRoom['_id']) {
		const room = this.getRoom(rid);
		return room.hasMoreNext.get();
	}

	public getMoreIfIsEmpty(rid: IRoom['_id']) {
		const room = this.getRoom(rid);

		if (room.loaded === undefined) {
			return this.getMore(rid);
		}
	}

	public isLoading(rid: IRoom['_id']) {
		const room = this.getRoom(rid);
		return room.isLoading.get();
	}

	public async clear(rid: IRoom['_id']) {
		const room = this.getRoom(rid);
		Messages.remove({ rid });
		room.isLoading.set(true);
		room.hasMore.set(true);
		room.hasMoreNext.set(false);
		room.oldestTs = undefined;
		room.loaded = undefined;
	}

	public async getSurroundingMessages(message?: Pick<IMessage, '_id' | 'rid'> & { ts?: Date }) {
		if (!message?.rid) {
			return;
		}

		const messageAlreadyLoaded = Boolean(Messages.findOne({ _id: message._id, _hidden: { $ne: true } }));

		if (messageAlreadyLoaded) {
			return;
		}

		const room = this.getRoom(message.rid);
		void this.clear(message.rid);

		const subscription = Subscriptions.findOne({ rid: message.rid });

		const result = await callWithErrorHandling('loadSurroundingMessages', message, defaultLimit);

		if (!result) {
			return;
		}

		upsertMessageBulk({ msgs: Array.from(result.messages).filter((msg) => msg.t !== 'command'), subscription });

		Tracker.afterFlush(async () => {
			this.emit('loaded-messages');
			room.isLoading.set(false);
		});

		if (!room.loaded) {
			room.loaded = 0;
		}
		room.loaded += result.messages.length;
		room.hasMore.set(result.moreBefore);
		room.hasMoreNext.set(result.moreAfter);
	}
}

export const RoomHistoryManager = new RoomHistoryManagerClass();
