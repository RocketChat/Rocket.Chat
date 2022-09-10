import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Emitter } from '@rocket.chat/emitter';
import type { IRoom } from '@rocket.chat/core-typings';

import { RoomHistoryManager } from './RoomHistoryManager';
import { RoomManager } from './RoomManager';
import { ChatSubscription, ChatMessage } from '../../../models/client';

export class ReadMessage extends Emitter {
	protected enabled: boolean;

	protected debug = false;

	constructor() {
		super();
		this.enable();
	}

	protected log(...args: any[]) {
		return this.debug && console.log(...args);
	}

	public enable() {
		this.enabled = document.hasFocus();
	}

	public disable() {
		this.enabled = false;
	}

	public isEnable() {
		return this.enabled === true;
	}

	public read(rid: IRoom['_id'] = Session.get('openedRoom')) {
		if (!this.enabled) {
			this.log('readMessage -> readNow canceled by enabled: false');
			return;
		}

		const subscription = ChatSubscription.findOne({ rid });
		if (subscription == null) {
			this.log('readMessage -> readNow canceled, no subscription found for rid:', rid);
			return;
		}

		if (subscription.alert === false && subscription.unread === 0) {
			this.log('readMessage -> readNow canceled, alert', subscription.alert, 'and unread', subscription.unread);
			return;
		}

		const room = RoomManager.getOpenedRoomByRid(rid);
		if (room == null) {
			this.log('readMessage -> readNow canceled, no room found for typeName:', subscription.t + subscription.name);
			return;
		}

		// Only read messages if user saw the first unread message
		const unreadMark = $('.message.first-unread, .rcx-message-divider--unread');
		if (unreadMark.length > 0) {
			const position = unreadMark.position();
			const visible = (position ? position.top : 0) >= 0;

			if (!visible) {
				this.log('readMessage -> readNow canceled, unread mark visible:', visible);
				return;
			}
			// if unread mark is not visible and there is more more not loaded unread messages
		} else if (RoomHistoryManager.getRoom(rid).unreadNotLoaded.get() > 0) {
			return;
		}

		return this.readNow(rid);
	}

	public readNow(rid: IRoom['_id'] = Session.get('openedRoom')) {
		if (rid == null) {
			this.log('readMessage -> readNow canceled, no rid informed');
			return;
		}

		const subscription = ChatSubscription.findOne({ rid });
		if (subscription == null) {
			this.log('readMessage -> readNow canceled, no subscription found for rid:', rid);
			return;
		}

		return Meteor.call('readMessages', rid, () => {
			RoomHistoryManager.getRoom(rid).unreadNotLoaded.set(0);
			return this.emit(rid);
		});
	}

	public refreshUnreadMark(rid: IRoom['_id']) {
		if (rid == null) {
			return;
		}

		const subscription = ChatSubscription.findOne({ rid }, { reactive: false });
		if (subscription == null) {
			return;
		}

		const room = RoomManager.openedRooms[subscription.t + subscription.name];
		if (room == null) {
			return;
		}

		if (!subscription.alert && subscription.unread === 0) {
			$('.message.first-unread').removeClass('first-unread');
			room.unreadSince.set(undefined);
			return;
		}

		let lastReadRecord = ChatMessage.findOne(
			{
				rid: subscription.rid,
				ts: {
					$lt: subscription.ls,
				},
			},
			{
				sort: {
					ts: -1,
				},
			},
		) as { ts: Date } | undefined;
		const { unreadNotLoaded } = RoomHistoryManager.getRoom(rid);

		if (lastReadRecord == null && unreadNotLoaded.get() === 0) {
			lastReadRecord = { ts: new Date(0) };
		}

		room.unreadSince.set((lastReadRecord || unreadNotLoaded.get() > 0) && subscription.ls);

		if (!lastReadRecord) {
			return;
		}

		const firstUnreadRecord = ChatMessage.findOne(
			{
				'rid': subscription.rid,
				'ts': {
					$gt: lastReadRecord.ts,
				},
				'u._id': {
					$ne: Meteor.userId(),
				},
			},
			{
				sort: {
					ts: 1,
				},
			},
		);

		if (firstUnreadRecord) {
			room.unreadFirstId = firstUnreadRecord._id;
			$('.message.first-unread').removeClass('first-unread');
			$(`.message#${firstUnreadRecord._id}`).addClass('first-unread');
		}
	}
}

export const readMessage = new ReadMessage();
