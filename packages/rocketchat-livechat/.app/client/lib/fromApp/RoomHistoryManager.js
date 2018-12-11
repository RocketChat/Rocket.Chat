import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Blaze } from 'meteor/blaze';
import visitor from '../../../imports/client/visitor';
import { ChatMessage } from '../collections';
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
				loaded: undefined,
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

		// $('.messages-box .wrapper').data('previous-height', $('.messages-box .wrapper').get(0)?.scrollHeight - $('.messages-box .wrapper').get(0)?.scrollTop)
		// ScrollListener.setLoader true
		const lastMessage = ChatMessage.findOne({ rid }, { fields: { ts: 1 }, sort: { ts: 1 } });
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
						ChatMessage.upsert({ _id: item._id }, item);
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
