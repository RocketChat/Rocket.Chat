/* globals readMessage UserRoles RoomRoles*/

import visitor from '../../../imports/client/visitor';
import _ from 'underscore';

export const RoomHistoryManager = new class {
	constructor() {
		this.defaultLimit = 50;
		this.histories = {};
	}
	getRoom(rid) {
		if ((this.histories[rid] == null)) {
			this.histories[rid] = {
				hasMore: new ReactiveVar(true),
				hasMoreNext: new ReactiveVar(false),
				isLoading: new ReactiveVar(false),
				unreadNotLoaded: new ReactiveVar(0),
				firstUnread: new ReactiveVar,
				loaded: undefined
			};
		}

		return this.histories[rid];
	}

	getMore(rid, limit) {
		if (limit == null) { limit = this.defaultLimit; }
		const room = this.getRoom(rid);
		if (room.hasMore.curValue !== true) {
			return;
		}

		room.isLoading.set(true);

		//$('.messages-box .wrapper').data('previous-height', $('.messages-box .wrapper').get(0)?.scrollHeight - $('.messages-box .wrapper').get(0)?.scrollTop)
		// ScrollListener.setLoader true
		const lastMessage = ChatMessage.findOne({rid}, { fields: { ts: 1 }, sort: { ts: 1 }});
		// lastMessage ?= ChatMessage.findOne({rid: rid}, {sort: {ts: 1}})

		let ts;
		if (lastMessage) {
			ts = lastMessage.ts;
		} else {
			ts = new Date();
		}

		Meteor.call('livechat:loadHistory', { token: visitor.getToken(), rid, ts, limit }, (err, result) => {
			if (err) {
				return;
			}

			if (result && result.messages) {
				result.messages.forEach((item) => {
					if (item.t !== 'command') {
						ChatMessage.upsert({_id: item._id}, item);
					}
				});
				room.isLoading.set(false);
				room.loaded += result.messages.length;
				if (result.messages.length < limit) {
					room.hasMore.set(false);
				}
			}
		});
	}

	getMoreNext(rid, limit) {
		if (limit == null) { limit = this.defaultLimit; }
		const room = this.getRoom(rid);
		if (room.hasMoreNext.curValue !== true) {
			return;
		}

		const instance = Blaze.getView($('.messages-box .wrapper')[0]).templateInstance();
		instance.atBottom = false;

		room.isLoading.set(true);

		const lastMessage = ChatMessage.findOne({rid}, {sort: {ts: -1}});

		let typeName = undefined;

		const subscription = ChatSubscription.findOne({rid});
		if (subscription != null) {
			// const { ls } = subscription;
			typeName = subscription.t + subscription.name;
		} else {
			const curRoomDoc = ChatRoom.findOne({_id: rid});
			typeName = (curRoomDoc != null ? curRoomDoc.t : undefined) + (curRoomDoc != null ? curRoomDoc.name : undefined);
		}

		const { ts } = lastMessage;

		if (ts) {
			return Meteor.call('loadNextMessages', rid, ts, limit, function(err, result) {
				for (const item of Array.from((result != null ? result.messages : undefined) || [])) {
					if (item.t !== 'command') {
						const roles = [
							(item.u && item.u._id && UserRoles.findOne(item.u._id, { fields: { roles: 1 }})) || {},
							(item.u && item.u._id && RoomRoles.findOne({rid: item.rid, 'u._id': item.u._id})) || {}
						].map(e => e.roles);
						item.roles = _.union.apply(_.union, roles);
						ChatMessage.upsert({_id: item._id}, item);
					}
				}

				Meteor.defer(() => RoomManager.updateMentionsMarksOfRoom(typeName));

				room.isLoading.set(false);
				if (room.loaded == null) { room.loaded = 0; }

				room.loaded += result.messages.length;
				if (result.messages.length < limit) {
					room.hasMoreNext.set(false);
				}
			});
		}
	}

	getSurroundingMessages(message, limit) {
		if (limit == null) { limit = this.defaultLimit; }
		if (!(message != null ? message.rid : undefined)) {
			return;
		}

		const instance = Blaze.getView($('.messages-box .wrapper')[0]).templateInstance();

		if (ChatMessage.findOne(message._id)) {
			const wrapper = $('.messages-box .wrapper');
			const msgElement = $(`#${ message._id }`, wrapper);
			const pos = (wrapper.scrollTop() + msgElement.offset().top) - (wrapper.height()/2);
			wrapper.animate({
				scrollTop: pos
			}, 500);
			msgElement.addClass('highlight');

			setTimeout(function() {
				const messages = wrapper[0];
				return instance.atBottom = messages.scrollTop >= (messages.scrollHeight - messages.clientHeight);
			});

			return setTimeout(() => msgElement.removeClass('highlight'), 500);
		} else {
			const room = this.getRoom(message.rid);
			room.isLoading.set(true);
			ChatMessage.remove({ rid: message.rid });

			let typeName = undefined;

			const subscription = ChatSubscription.findOne({rid: message.rid});
			if (subscription) {
				// const { ls } = subscription;
				typeName = subscription.t + subscription.name;
			} else {
				const curRoomDoc = ChatRoom.findOne({_id: message.rid});
				typeName = (curRoomDoc != null ? curRoomDoc.t : undefined) + (curRoomDoc != null ? curRoomDoc.name : undefined);
			}

			return Meteor.call('loadSurroundingMessages', message, limit, function(err, result) {
				for (const item of Array.from((result != null ? result.messages : undefined) || [])) {
					if (item.t !== 'command') {
						const roles = [
							(item.u && item.u._id && UserRoles.findOne(item.u._id, { fields: { roles: 1 }})) || {},
							(item.u && item.u._id && RoomRoles.findOne({rid: item.rid, 'u._id': item.u._id})) || {}
						].map(e => e.roles);
						item.roles = _.union.apply(_.union, roles);
						ChatMessage.upsert({_id: item._id}, item);
					}
				}

				Meteor.defer(function() {
					readMessage.refreshUnreadMark(message.rid, true);
					RoomManager.updateMentionsMarksOfRoom(typeName);
					const wrapper = $('.messages-box .wrapper');
					const msgElement = $(`#${ message._id }`, wrapper);
					const pos = (wrapper.scrollTop() + msgElement.offset().top) - (wrapper.height()/2);
					wrapper.animate({
						scrollTop: pos
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
				if (room.loaded == null) { room.loaded = 0; }
				room.loaded += result.messages.length;
				room.hasMore.set(result.moreBefore);
				return room.hasMoreNext.set(result.moreAfter);
			});
		}
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
		if (this.histories[rid] != null) {
			this.histories[rid].hasMore.set(true);
			this.histories[rid].isLoading.set(false);
			return this.histories[rid].loaded = undefined;
		}
	}
};
this.RoomHistoryManager = RoomHistoryManager;
