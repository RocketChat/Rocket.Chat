import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { Blaze } from 'meteor/blaze';
import { v4 as uuidv4 } from 'uuid';
import differenceInMilliseconds from 'date-fns/differenceInMilliseconds';
import { Emitter } from '@rocket.chat/emitter';
import type { IMessage, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';

import { waitUntilWrapperExists } from './waitUntilWrapperExists';
import { readMessage } from './readMessages';
import { getConfig } from '../../../../client/lib/utils/getConfig';
import { ChatMessage, ChatSubscription } from '../../../models/client';
import { callWithErrorHandling } from '../../../../client/lib/utils/callWithErrorHandling';
import { onClientMessageReceived } from '../../../../client/lib/onClientMessageReceived';
import {
	setHighlightMessage,
	clearHighlightMessage,
} from '../../../../client/views/room/MessageList/providers/messageHighlightSubscription';
import type { RoomTemplateInstance } from '../../../ui/client/views/app/lib/RoomTemplateInstance';
import { normalizeThreadMessage } from '../../../../client/lib/normalizeThreadMessage';

export async function upsertMessage(
	{
		msg,
		subscription,
		uid = Tracker.nonreactive(() => Meteor.userId()) ?? undefined,
	}: {
		msg: IMessage & { ignored?: boolean };
		subscription?: ISubscription;
		uid?: IUser['_id'];
	},
	{ direct } = ChatMessage,
) {
	const userId = msg.u?._id;

	if (subscription?.ignored?.includes(userId)) {
		msg.ignored = true;
	}

	if (msg.t === 'e2e' && !msg.file) {
		msg.e2e = 'pending';
	}
	msg = (await onClientMessageReceived(msg)) || msg;

	const { _id, ...messageToUpsert } = msg;

	if (msg.tcount) {
		direct.update(
			{ tmid: _id },
			{
				$set: {
					following: uid && (msg.replies?.includes(uid) ?? false),
					threadMsg: normalizeThreadMessage(messageToUpsert),
					repliesCount: msg.tcount,
				},
			},
			{ multi: true },
		);
	}

	return direct.upsert({ _id }, messageToUpsert);
}

export function upsertMessageBulk({ msgs, subscription }: { msgs: IMessage[]; subscription?: ISubscription }, collection = ChatMessage) {
	const uid = Tracker.nonreactive(() => Meteor.userId()) ?? undefined;
	const { queries } = collection;
	collection.queries = [];
	msgs.forEach((msg, index) => {
		if (index === msgs.length - 1) {
			collection.queries = queries;
		}
		upsertMessage({ msg, subscription, uid }, collection);
	});
}

const defaultLimit = parseInt(getConfig('roomListLimit') ?? '50') || 50;

const waitAfterFlush = (fn: () => void) => setTimeout(() => Tracker.afterFlush(fn), 10);

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
		let ts;
		const room = this.getRoom(rid);

		if (Tracker.nonreactive(() => room.hasMore.get()) !== true) {
			return;
		}

		room.isLoading.set(true);

		await this.queue();

		// ScrollListener.setLoader true
		const lastMessage = ChatMessage.findOne({ rid, _hidden: { $ne: true } }, { sort: { ts: 1 } });
		// lastMessage ?= ChatMessage.findOne({rid: rid}, {sort: {ts: 1}})

		if (lastMessage) {
			({ ts } = lastMessage);
		} else {
			ts = undefined;
		}

		let ls = undefined;

		const subscription = ChatSubscription.findOne({ rid });
		if (subscription) {
			({ ls } = subscription);
		}

		const result = await callWithErrorHandling('loadHistory', rid, ts, limit, ls);

		this.unqueue();

		let previousHeight: number | undefined;
		let scroll: number | undefined;
		const { messages = [] } = result;
		room.unreadNotLoaded.set(result.unreadNotLoaded);
		room.firstUnread.set(result.firstUnread);

		const wrapper = await waitUntilWrapperExists();

		if (wrapper) {
			previousHeight = wrapper.scrollHeight;
			scroll = wrapper.scrollTop;
		}

		upsertMessageBulk({
			msgs: messages.filter((msg) => msg.t !== 'command'),
			subscription,
		});

		if (!room.loaded) {
			room.loaded = 0;
		}

		const visibleMessages = messages.filter((msg) => !msg.tmid || msg.tshow);

		room.loaded += visibleMessages.length;

		if (messages.length < limit) {
			room.hasMore.set(false);
		}

		if (room.hasMore.get() && (visibleMessages.length === 0 || room.loaded < limit)) {
			return this.getMore(rid);
		}

		waitAfterFlush(() => {
			const heightDiff = wrapper.scrollHeight - (previousHeight ?? NaN);
			wrapper.scrollTop = (scroll ?? NaN) + heightDiff;
		});

		room.isLoading.set(false);
		waitAfterFlush(() => {
			readMessage.refreshUnreadMark(rid);
		});
	}

	public async getMoreNext(rid: IRoom['_id'], limit = defaultLimit) {
		const room = this.getRoom(rid);
		if (Tracker.nonreactive(() => room.hasMoreNext.get()) !== true) {
			return;
		}

		await this.queue();
		const instance = Blaze.getView($('.messages-box .wrapper')[0]).templateInstance() as RoomTemplateInstance;
		instance.atBottom = false;

		room.isLoading.set(true);

		const lastMessage = ChatMessage.findOne({ rid, _hidden: { $ne: true } }, { sort: { ts: -1 } });

		const subscription = ChatSubscription.findOne({ rid });

		if (lastMessage?.ts) {
			const { ts } = lastMessage;
			const result = await callWithErrorHandling('loadNextMessages', rid, ts, limit);
			upsertMessageBulk({
				msgs: Array.from(result.messages).filter((msg) => msg.t !== 'command'),
				subscription,
			});

			room.isLoading.set(false);
			if (!room.loaded) {
				room.loaded = 0;
			}

			room.loaded += result.messages.length;
			if (result.messages.length < limit) {
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
		ChatMessage.remove({ rid });
		room.isLoading.set(true);
		room.hasMore.set(true);
		room.hasMoreNext.set(false);
		room.loaded = undefined;
	}

	public async getSurroundingMessages(message?: Pick<IMessage, '_id' | 'rid'> & { ts?: Date }, limit = defaultLimit) {
		if (!message || !message.rid) {
			return;
		}

		const w = (await waitUntilWrapperExists()) as HTMLElement;

		const instance = Blaze.getView(w).templateInstance() as RoomTemplateInstance;

		const surroundingMessage = ChatMessage.findOne({ _id: message._id, _hidden: { $ne: true } });

		if (surroundingMessage) {
			await waitUntilWrapperExists(`[data-id='${message._id}']`);
			const wrapper = $('.messages-box .wrapper');
			const msgElement = $(`[data-id='${message._id}']`, wrapper);

			if (msgElement.length === 0) {
				return;
			}

			const pos = (wrapper.scrollTop() ?? NaN) + (msgElement.offset()?.top ?? NaN) - (wrapper.height() ?? NaN) / 2;
			wrapper.animate(
				{
					scrollTop: pos,
				},
				500,
			);

			msgElement.addClass('highlight');
			setHighlightMessage(message._id);

			setTimeout(() => {
				msgElement.removeClass('highlight');
			}, 500);

			setTimeout(() => {
				clearHighlightMessage();
			}, 1000);

			return;
		}

		const room = this.getRoom(message.rid);
		room.isLoading.set(true);
		room.hasMore.set(false);

		const subscription = ChatSubscription.findOne({ rid: message.rid });

		const result = await callWithErrorHandling('loadSurroundingMessages', message, limit);

		if (!result || !result.messages) {
			return;
		}

		upsertMessageBulk({ msgs: Array.from(result.messages).filter((msg) => msg.t !== 'command'), subscription });

		readMessage.refreshUnreadMark(message.rid);

		Tracker.afterFlush(async () => {
			await waitUntilWrapperExists(`[data-id='${message._id}']`);
			const wrapper = $('.messages-box .wrapper');
			const msgElement = $(`[data-id=${message._id}]`, wrapper);

			if (msgElement.length === 0) {
				return;
			}

			const pos = (wrapper.scrollTop() ?? NaN) + (msgElement.offset()?.top ?? NaN) - (wrapper.height() ?? NaN) / 2;
			wrapper.animate(
				{
					scrollTop: pos,
				},
				500,
			);

			msgElement.addClass('highlight');
			setHighlightMessage(message._id);

			room.isLoading.set(false);
			const messages = wrapper[0];
			instance.atBottom = !result.moreAfter && messages.scrollTop >= messages.scrollHeight - messages.clientHeight;

			setTimeout(() => {
				msgElement.removeClass('highlight');
			}, 500);

			setTimeout(() => {
				clearHighlightMessage();
			}, 1000);
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
