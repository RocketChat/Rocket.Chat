import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Meteor } from 'meteor/meteor';

import { ChatMessage } from '../../../app/models/client';
import { RoomHistoryManager } from '../../../app/ui-utils/client/lib/RoomHistoryManager';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { withDebouncing } from '../../../lib/utils/highOrderFunctions';

type UnsuscribeWindowEvents = () => void;
type UnsuscribeUnreadStateChange = () => void;

export class ReadStateManager extends Emitter {
	private rid: IRoom['_id'];

	private firstUnreadRecordId?: IMessage['_id'];

	private subscription?: ISubscription;

	public constructor(rid: IRoom['_id']) {
		super();
		this.rid = rid;
	}

	public getRid() {
		return this.rid;
	}

	// TODO: Use ref to get unreadMark
	// private unreadMark?: HTMLElement;
	private get unreadMark() {
		return document.querySelector<HTMLElement>('.rcx-message-divider--unread');
	}

	public onUnreadStateChange = (callback: (firstUnreadRecord?: IMessage['_id']) => void): UnsuscribeUnreadStateChange => {
		console.log(this.firstUnreadRecordId);
		callback(this.firstUnreadRecordId);
		const unsub = this.on('unread-state-change', callback);
		return unsub;
	};

	public updateSubscription(subscription?: ISubscription) {
		if (!subscription) {
			return;
		}

		this.subscription = subscription;
		const { unread, alert } = this.subscription || {};
		if (!unread && !alert) {
			return;
		}

		if (document.hasFocus() && this.firstUnreadRecordId) {
			return;
		}

		this.updateFirstUnreadRecordId();
	}

	private updateFirstUnreadRecordId() {
		if (!this.subscription?.ls) {
			return;
		}
		console.log(this.subscription.ls);

		const firstUnreadRecord = ChatMessage.findOne(
			{
				'rid': this.subscription.rid,
				'ts': {
					$gt: this.subscription.ls,
				},
				'u._id': {
					$ne: Meteor.userId() ?? undefined,
				},
			},
			{
				sort: {
					ts: 1,
				},
			},
		);
		console.log({ firstUnreadRecord });

		this.firstUnreadRecordId = firstUnreadRecord?._id;
		this.emit('unread-state-change', firstUnreadRecord?._id);
	}

	public handleWindowEvents = (): UnsuscribeWindowEvents => {
		const handleWindowFocus = () => {
			this.attemptMarkAsRead();
		};

		const handleWindowKeyUp = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				this.markAsRead();
				this.updateFirstUnreadRecordId();
			}
		};

		window.addEventListener('focus', handleWindowFocus);
		window.addEventListener('keyup', handleWindowKeyUp);

		return () => {
			window.removeEventListener('focus', handleWindowFocus);
			window.removeEventListener('keyup', handleWindowKeyUp);
		};
	};

	private isUnreadMarkVisible(): boolean {
		if (!this.unreadMark) {
			return false;
		}

		return this.unreadMark.offsetTop > (this.unreadMark.offsetParent?.scrollTop || 0);
	}

	// This will only mark as read if the unread mark is visible
	public attemptMarkAsRead() {
		const { alert, unread } = this.subscription || {};
		if (!alert && unread === 0) {
			return;
		}

		if (!document.hasFocus()) {
			return;
		}

		if (!this.isUnreadMarkVisible()) {
			return;
		}
		// if there are unloaded unread messages, don't mark as read
		if (RoomHistoryManager.getRoom(this.rid).unreadNotLoaded.get() > 0) {
			return;
		}

		return this.markAsRead();
	}

	public debouncedMarkAsRead = withDebouncing({ wait: 1000 })(() => {
		try {
			return this.markAsRead();
		} catch (e) {
			console.error(e);
		}
	});

	// this will always mark as read.
	public markAsRead() {
		if (!this.rid) {
			return;
		}

		return sdk.rest.post('/v1/subscriptions.read', { rid: this.rid }).then(() => {
			RoomHistoryManager.getRoom(this.rid).unreadNotLoaded.set(0);
		});
	}
}
