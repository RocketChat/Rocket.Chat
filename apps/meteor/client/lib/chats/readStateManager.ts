import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Meteor } from 'meteor/meteor';

import { ChatMessage } from '../../../app/models/client';
import { LegacyRoomManager } from '../../../app/ui-utils/client/lib/LegacyRoomManager';
import { RoomHistoryManager } from '../../../app/ui-utils/client/lib/RoomHistoryManager';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { withDebouncing } from '../../../lib/utils/highOrderFunctions';

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

	public onUnreadStateChange = (callback: () => void): (() => void) => {
		return this.on('unread-state-change', callback);
	};

	public getFirstUnreadRecordId = () => {
		return this.firstUnreadRecordId;
	};

	public updateSubscription(subscription?: ISubscription) {
		if (!subscription) {
			return;
		}

		const firstUpdate = !this.subscription;

		this.subscription = subscription;
		LegacyRoomManager.getOpenedRoomByRid(this.rid)?.unreadSince.set(this.subscription.ls);

		const { unread, alert } = this.subscription;
		if (!unread && !alert) {
			return;
		}

		if (firstUpdate) {
			this.updateFirstUnreadRecordId();
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

		this.setFirstUnreadRecordId(firstUnreadRecord?._id);

		RoomHistoryManager.once('loaded-messages', () => this.updateFirstUnreadRecordId());
	}

	private setFirstUnreadRecordId(firstUnreadRecordId: string | undefined) {
		this.firstUnreadRecordId = firstUnreadRecordId;
		this.emit('unread-state-change', this.firstUnreadRecordId);
	}

	public clearUnreadMark() {
		this.setFirstUnreadRecordId(undefined);
	}

	public handleWindowEvents = (): (() => void) => {
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

		if (this.unreadMark && !this.isUnreadMarkVisible()) {
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
	public async markAsRead() {
		if (!this.rid) {
			return;
		}

		return sdk.rest.post('/v1/subscriptions.read', { rid: this.rid }).then(() => {
			RoomHistoryManager.getRoom(this.rid).unreadNotLoaded.set(0);
		});
	}
}
