import s from 'underscore.string';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { Blaze } from 'meteor/blaze';

import { promises } from '../../../promises/client';
import { RoomManager } from './RoomManager';
import { readMessage } from './readMessages';
import { renderMessageBody } from './renderMessageBody';
import { getConfig } from '../config';
import { ChatMessage, ChatSubscription, ChatRoom } from '../../../models';

export const normalizeThreadMessage = (message) => {
	if (message.msg) {
		return renderMessageBody(message).replace(/<br\s?\\?>/g, ' ');
	}

	if (message.attachments) {
		const attachment = message.attachments.find((attachment) => attachment.title || attachment.description);

		if (attachment && attachment.description) {
			return s.escapeHTML(attachment.description);
		}

		if (attachment && attachment.title) {
			return s.escapeHTML(attachment.title);
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
	msg = await promises.run('onClientMessageReceived', msg) || msg;

	const { _id, ...messageToUpsert } = msg;

	if (msg.tcount) {
		collection.direct.update({ tmid: _id }, {
			$set: {
				following: msg.replies && msg.replies.indexOf(uid) > -1,
				threadMsg: normalizeThreadMessage(messageToUpsert),
				repliesCount: msg.tcount,
			},
		}, { multi: true });
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

export const RoomHistoryManager = new class {
	constructor() {
		this.histories = {};
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

	getMore(rid, limit = defaultLimit) {
		let ts;
		const room = this.getRoom(rid);

		if (room.hasMore.curValue !== true) {
			return;
		}

		room.isLoading.set(true);

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

		Meteor.call('loadHistory', rid, ts, limit, ls, (err, result) => {
			if (err) {
				return;
			}

			let previousHeight;
			const { messages = [] } = result;
			room.unreadNotLoaded.set(result.unreadNotLoaded);
			room.firstUnread.set(result.firstUnread);

			const wrapper = $('.messages-box .wrapper').get(0);
			if (wrapper) {
				previousHeight = wrapper.scrollHeight;
			}

			upsertMessageBulk({
				msgs: messages.filter((msg) => msg.t !== 'command'),
				subscription,
			});

			if (!room.loaded) {
				room.loaded = 0;
			}

			room.loaded += messages.length;

			if (messages.length < limit) {
				return room.hasMore.set(false);
			}

			if (wrapper) {
				if (wrapper.scrollHeight <= wrapper.offsetHeight) {
					return this.getMore(rid);
				}
				const heightDiff = wrapper.scrollHeight - previousHeight;
				wrapper.scrollTop += heightDiff;
			}

			room.isLoading.set(false);
			readMessage.refreshUnreadMark(rid, true);
			return RoomManager.updateMentionsMarksOfRoom(typeName);
		});
	}

	getMoreNext(rid, limit = defaultLimit) {
		const room = this.getRoom(rid);
		if (room.hasMoreNext.curValue !== true) {
			return;
		}

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

		const { ts } = lastMessage;

		if (ts) {
			return Meteor.call('loadNextMessages', rid, ts, limit, function(err, result) {
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
			});
		}
	}

	getSurroundingMessages(message, limit = defaultLimit) {
		if (!message || !message.rid) {
			return;
		}

		const instance = Blaze.getView($('.messages-box .wrapper')[0]).templateInstance();

		if (ChatMessage.findOne({ _id: message._id, _hidden: { $ne: true } })) {
			const wrapper = $('.messages-box .wrapper');
			const msgElement = $(`#${ message._id }`, wrapper);
			if (msgElement.length === 0) {
				return;
			}
			const pos = (wrapper.scrollTop() + msgElement.offset().top) - (wrapper.height() / 2);
			wrapper.animate({
				scrollTop: pos,
			}, 500);
			msgElement.addClass('highlight');

			setTimeout(function() {
				const messages = wrapper[0];
				instance.atBottom = messages.scrollTop >= (messages.scrollHeight - messages.clientHeight);
			});

			return setTimeout(() => msgElement.removeClass('highlight'), 500);
		}
		const room = this.getRoom(message.rid);
		room.isLoading.set(true);
		ChatMessage.remove({ rid: message.rid });

		let typeName = undefined;

		const subscription = ChatSubscription.findOne({ rid: message.rid });
		if (subscription) {
			// const { ls } = subscription;
			typeName = subscription.t + subscription.name;
		} else {
			const curRoomDoc = ChatRoom.findOne({ _id: message.rid });
			typeName = (curRoomDoc ? curRoomDoc.t : undefined) + (curRoomDoc ? curRoomDoc.name : undefined);
		}

		return Meteor.call('loadSurroundingMessages', message, limit, function(err, result) {
			if (!result || !result.messages) {
				return;
			}
			for (const msg of Array.from(result.messages)) {
				if (msg.t !== 'command') {
					upsertMessage({ msg, subscription });
				}
			}

			Meteor.defer(function() {
				readMessage.refreshUnreadMark(message.rid, true);
				RoomManager.updateMentionsMarksOfRoom(typeName);
				const wrapper = $('.messages-box .wrapper');
				const msgElement = $(`#${ message._id }`, wrapper);
				const pos = (wrapper.scrollTop() + msgElement.offset().top) - (wrapper.height() / 2);
				wrapper.animate({
					scrollTop: pos,
				}, 500);

				msgElement.addClass('highlight');

				setTimeout(function() {
					room.isLoading.set(false);
					const messages = wrapper[0];
					instance.atBottom = !result.moreAfter && (messages.scrollTop >= (messages.scrollHeight - messages.clientHeight));
					return 500;
				});

				return setTimeout(() => msgElement.removeClass('highlight'), 500);
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

	clear(rid) {
		ChatMessage.remove({ rid });
		if (this.histories[rid]) {
			this.histories[rid].hasMore.set(true);
			this.histories[rid].isLoading.set(false);
			this.histories[rid].loaded = undefined;
		}
	}
}();
