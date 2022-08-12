import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { Blaze } from 'meteor/blaze';
import { v4 as uuidv4 } from 'uuid';
import differenceInMilliseconds from 'date-fns/differenceInMilliseconds';
import { Emitter } from '@rocket.chat/emitter';
import { escapeHTML } from '@rocket.chat/string-helpers';

import { waitUntilWrapperExists } from './waitUntilWrapperExists';
import { RoomManager } from './RoomManager';
import { readMessage } from './readMessages';
import { renderMessageBody } from '../../../../client/lib/utils/renderMessageBody';
import { getConfig } from '../../../../client/lib/utils/getConfig';
import { ChatMessage, ChatSubscription, ChatRoom } from '../../../models/client';
import { callWithErrorHandling } from '../../../../client/lib/utils/callWithErrorHandling';
import { filterMarkdown } from '../../../markdown/lib/markdown';
import { onClientMessageReceived } from '../../../../client/lib/onClientMessageReceived';
import {
	setHighlightMessage,
	clearHighlightMessage,
} from '../../../../client/views/room/MessageList/providers/messageHighlightSubscription';

export const normalizeThreadMessage = ({ ...message }) => {
	if (message.msg) {
		message.msg = filterMarkdown(message.msg);
		delete message.mentions;
		return renderMessageBody(message).replace(/<br\s?\\?>/g, ' ');
	}

	if (message.attachments) {
		const attachment = message.attachments.find((attachment) => attachment.title || attachment.description);

		if (attachment && attachment.description) {
			return escapeHTML(attachment.description);
		}

		if (attachment && attachment.title) {
			return escapeHTML(attachment.title);
		}
	}
};

export const upsertMessage = async ({ msg, subscription, uid = Tracker.nonreactive(() => Meteor.userId()) }, collection = ChatMessage) => {
	const userId = msg.u && msg.u._id;

	if (subscription && subscription.ignored && subscription.ignored.indexOf(userId) > -1) {
		msg.ignored = true;
	}

	// const roles = [
	// 	(userId && UserRoles.findOne(userId, { fields: { roles: 1 } })) || {},
	// 	(userId && RoomRoles.findOne({ rid: msg.rid, 'u._id': userId })) || {},
	// ].map((e) => e.roles);
	// msg.roles = _.union.apply(_.union, roles);

	if (msg.t === 'e2e' && !msg.file) {
		msg.e2e = 'pending';
	}
	msg = (await onClientMessageReceived(msg)) || msg;

	const { _id, ...messageToUpsert } = msg;

	if (msg.tcount) {
		collection.direct.update(
			{ tmid: _id },
			{
				$set: {
					following: msg.replies && msg.replies.indexOf(uid) > -1,
					threadMsg: normalizeThreadMessage(messageToUpsert),
					repliesCount: msg.tcount,
				},
			},
			{ multi: true },
		);
	}

	return collection.direct.upsert({ _id }, messageToUpsert);
};

export function upsertMessageBulk({ msgs, subscription }, collection = ChatMessage) {
	const uid = Tracker.nonreactive(() => Meteor.userId());
	const { queries } = ChatMessage;
	collection.queries = [];
	msgs.forEach((msg, index) => {
		if (index === msgs.length - 1) {
			ChatMessage.queries = queries;
		}
		upsertMessage({ msg, subscription, uid }, collection);
	});
}

const defaultLimit = parseInt(getConfig('roomListLimit')) || 50;

const waitAfterFlush = (fn) => setTimeout(() => Tracker.afterFlush(fn), 10);

export const RoomHistoryManager = new (class extends Emitter {
	constructor() {
		super();
		this.histories = {};
		this.requestsList = [];
	}

	getRoom(rid) {
		if (!this.histories[rid]) {
			this.histories[rid] = {
				hasMore: new ReactiveVar(true),
				hasMoreNext: new ReactiveVar(false),
				isLoading: new ReactiveVar(false),
				unreadNotLoaded: new ReactiveVar(0),
				firstUnread: new ReactiveVar(),
				loaded: undefined,
			};
		}

		return this.histories[rid];
	}

	async queue() {
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

	run(fn) {
		const difference = differenceInMilliseconds(new Date(), this.lastRequest);
		if (!this.lastRequest || difference > 500) {
			return fn();
		}
		return setTimeout(fn, 500 - difference);
	}

	unqueue() {
		const requestId = this.requestsList.pop();
		if (!requestId) {
			return;
		}
		this.run(() => this.emit(requestId));
	}

	async getMore(rid, limit = defaultLimit) {
		let ts;
		const room = this.getRoom(rid);

		if (room.hasMore.curValue !== true) {
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
		let typeName = undefined;

		const subscription = ChatSubscription.findOne({ rid });
		if (subscription) {
			({ ls } = subscription);
			typeName = subscription.t + subscription.name;
		} else {
			const curRoomDoc = ChatRoom.findOne({ _id: rid });
			typeName = (curRoomDoc ? curRoomDoc.t : undefined) + (curRoomDoc ? curRoomDoc.name : undefined);
		}

		const result = await callWithErrorHandling('loadHistory', rid, ts, limit, ls);

		this.unqueue();

		let previousHeight;
		let scroll;
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
			const heightDiff = wrapper.scrollHeight - previousHeight;
			wrapper.scrollTop = scroll + heightDiff;
		});

		room.isLoading.set(false);
		waitAfterFlush(() => {
			readMessage.refreshUnreadMark(rid);
			return RoomManager.updateMentionsMarksOfRoom(typeName);
		});
	}

	async getMoreNext(rid, limit = defaultLimit) {
		const room = this.getRoom(rid);
		if (room.hasMoreNext.curValue !== true) {
			return;
		}

		await this.queue();
		const instance = Blaze.getView($('.messages-box .wrapper')[0]).templateInstance();
		instance.atBottom = false;

		room.isLoading.set(true);

		const lastMessage = ChatMessage.findOne({ rid, _hidden: { $ne: true } }, { sort: { ts: -1 } });

		let typeName = undefined;

		const subscription = ChatSubscription.findOne({ rid });
		if (subscription) {
			// const { ls } = subscription;
			typeName = subscription.t + subscription.name;
		} else {
			const curRoomDoc = ChatRoom.findOne({ _id: rid });
			typeName = (curRoomDoc ? curRoomDoc.t : undefined) + (curRoomDoc ? curRoomDoc.name : undefined);
		}

		if (lastMessage?.ts) {
			const { ts } = lastMessage;
			const result = await callWithErrorHandling('loadNextMessages', rid, ts, limit);
			upsertMessageBulk({
				msgs: Array.from(result.messages).filter((msg) => msg.t !== 'command'),
				subscription,
			});

			Meteor.defer(() => RoomManager.updateMentionsMarksOfRoom(typeName));

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

	async getSurroundingMessages(message, limit = defaultLimit) {
		if (!message || !message.rid) {
			return;
		}

		const w = await waitUntilWrapperExists();

		const instance = Blaze.getView(w).templateInstance();

		const surroundingMessage = ChatMessage.findOne({ _id: message._id, _hidden: { $ne: true } });

		if (surroundingMessage) {
			await waitUntilWrapperExists(`[data-id='${message._id}']`);
			const wrapper = $('.messages-box .wrapper');
			const msgElement = $(`[data-id='${message._id}']`, wrapper);

			if (msgElement.length === 0) {
				return;
			}

			const pos = wrapper.scrollTop() + msgElement.offset().top - wrapper.height() / 2;
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
		let typeName = undefined;

		const subscription = ChatSubscription.findOne({ rid: message.rid });
		if (subscription) {
			// const { ls } = subscription;
			typeName = subscription.t + subscription.name;
		} else {
			const curRoomDoc = ChatRoom.findOne({ _id: message.rid });
			typeName = (curRoomDoc ? curRoomDoc.t : undefined) + (curRoomDoc ? curRoomDoc.name : undefined);
		}

		return Meteor.call('loadSurroundingMessages', message, limit, async function (err, result) {
			if (!result || !result.messages) {
				return;
			}

			upsertMessageBulk({ msgs: Array.from(result.messages).filter((msg) => msg.t !== 'command'), subscription });

			readMessage.refreshUnreadMark(message.rid);
			RoomManager.updateMentionsMarksOfRoom(typeName);

			Tracker.afterFlush(async () => {
				await waitUntilWrapperExists(`[data-id='${message._id}']`);
				const wrapper = $('.messages-box .wrapper');
				const msgElement = $(`[data-id=${message._id}]`, wrapper);

				if (msgElement.length === 0) {
					return;
				}

				const pos = wrapper.scrollTop() + msgElement.offset().top - wrapper.height() / 2;
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
			return room.hasMoreNext.set(result.moreAfter);
		});
	}

	hasMore(rid) {
		const room = this.getRoom(rid);
		return room.hasMore.get();
	}

	hasMoreNext(rid) {
		const room = this.getRoom(rid);
		return room.hasMoreNext.get();
	}

	getMoreIfIsEmpty(rid) {
		const room = this.getRoom(rid);

		if (room.loaded === undefined) {
			return this.getMore(rid);
		}
	}

	isLoading(rid) {
		const room = this.getRoom(rid);
		return room.isLoading.get();
	}

	async clear(rid) {
		const room = this.getRoom(rid);
		ChatMessage.remove({ rid });
		room.isLoading.set(true);
		room.hasMore.set(true);
		room.hasMoreNext.set(false);
		room.loaded = undefined;
	}
})();
