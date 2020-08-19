import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import { t, roomTypes } from '../../utils';
import { popover, renderMessageBody, menu } from '../../ui-utils';
import { ChatSubscription } from '../../models/client';
import { hasAtLeastOnePermission } from '../../authorization';
import { timeAgo } from '../../lib/client/lib/formatDate';
import { getUidDirectMessage } from '../../ui-utils/client/lib/getUidDirectMessage';

Template.sidebarItem.helpers({
	streaming() {
		return this.room.streamingOptions && Object.keys(this.room.streamingOptions).length;
	},
	isRoom() {
		return this.room.rid || this.room._id;
	},
	isExtendedViewMode() {
		return Template.currentData().settings.extended;
	},
	lastMessage() {
		return this.room.lastMessage && Template.instance().renderedMessage;
	},
	lastMessageTs() {
		return this.room.lastMessage && Template.instance().lastMessageTs.get();
	},
	mySelf() {
		return this.room.t === 'd' && this.room.name === Template.instance().user.username;
	},
	isLivechatQueue() {
		return this.room.pathSection === 'livechat-queue';
	},
	showUnread() {
		return this.room.unread > 0 || (!this.room.hideUnreadStatus && this.room.alert);
	},
	unread() {
		const { unread = 0, tunread = [] } = this;
		return unread + tunread.length;
	},
	lastMessageUnread() {
		if (!this.room.ls) {
			return true;
		}
		if (!this.room.lastMessage?.ts) {
			return false;
		}

		return this.room.lastMessage.ts > this.room.ls;
	},
	badgeClass() {
		const { unread, userMentions, groupMentions, tunread = [], tunreadGroup = [], tunreadUser = [] } = this.room;

		if (userMentions || tunreadUser.length > 0) {
			return 'badge badge--user-mentions';
		}

		if (groupMentions || tunreadGroup.length > 0) {
			return 'badge badge--group-mentions';
		}

		if (tunread.length) {
			return 'badge badge--thread';
		}

		if (unread) {
			return 'badge';
		}
	},
});

function setLastMessageTs(instance, ts) {
	if (instance.timeAgoInterval) {
		clearInterval(instance.timeAgoInterval);
	}

	instance.lastMessageTs.set(timeAgo(ts));

	instance.timeAgoInterval = setInterval(() => {
		requestAnimationFrame(() => instance.lastMessageTs.set(timeAgo(ts)));
	}, 60000);
}

Template.sidebarItem.onCreated(function() {
	this.user = this.data.user;

	this.lastMessageTs = new ReactiveVar();

	this.autorun(() => {
		const { room, uid, settings: { extended, useRealName } } = Template.currentData();

		if (!room.lastMessage || !extended) {
			return clearInterval(this.timeAgoInterval);
		}

		if (!room.lastMessage._id) {
			this.renderedMessage = room.lastMessage.msg;
			return;
		}

		setLastMessageTs(this, room.lm || room.lastMessage.ts);

		if (room.lastMessage.t === 'e2e' && room.lastMessage.e2e !== 'done') {
			this.renderedMessage = '******';
			return;
		}

		const otherUser = useRealName ? room.lastMessage.u.name || room.lastMessage.u.username : room.lastMessage.u.username;
		const renderedMessage = renderMessageBody(room.lastMessage).replace(/<br\s?\\?>/g, ' ');
		const sender = this.user && this.user._id === room.lastMessage.u._id ? t('You') : otherUser;

		if (!room.isGroupChat && uid !== room.lastMessage.u._id) {
			this.renderedMessage = room.lastMessage.msg === '' ? t('Sent_an_attachment') : renderedMessage;
		} else {
			this.renderedMessage = room.lastMessage.msg === '' ? t('user_sent_an_attachment', { user: sender }) : `${ sender }: ${ renderedMessage }`;
		}
	});
});

Template.sidebarItem.events({
	'click [data-id], click .sidebar-item__link'() {
		return menu.close();
	},
	'click .sidebar-item__menu'(e) {
		e.stopPropagation(); // to not close the menu
		e.preventDefault();

		const canLeave = () => {
			const roomData = Session.get(`roomData${ this.rid }`);

			if (!roomData) { return false; }

			if (roomData.t === 'c' && !hasAtLeastOnePermission('leave-c')) { return false; }
			if (roomData.t === 'p' && !hasAtLeastOnePermission('leave-p')) { return false; }

			return !(((roomData.cl != null) && !roomData.cl) || ['d', 'l'].includes(roomData.t));
		};

		const canFavorite = Template.currentData().settings.favoriteRooms && ChatSubscription.find({ rid: this.rid }).count() > 0;
		const isFavorite = () => {
			const sub = ChatSubscription.findOne({ rid: this.rid }, { fields: { f: 1 } });
			if (((sub != null ? sub.f : undefined) != null) && sub.f) {
				return true;
			}
			return false;
		};

		const items = [{
			icon: 'eye-off',
			name: t('Hide_room'),
			type: 'sidebar-item',
			id: 'hide',
		}];

		if (this.alert) {
			items.push({
				icon: 'flag',
				name: t('Mark_read'),
				type: 'sidebar-item',
				id: 'read',
			});
		} else {
			items.push({
				icon: 'flag',
				name: t('Mark_unread'),
				type: 'sidebar-item',
				id: 'unread',
			});
		}

		if (canFavorite) {
			items.push({
				icon: 'star',
				name: t(isFavorite() ? 'Unfavorite' : 'Favorite'),
				modifier: isFavorite() ? 'star-filled' : 'star',
				type: 'sidebar-item',
				id: 'favorite',
			});
		}

		if (canLeave()) {
			items.push({
				icon: 'sign-out',
				name: t('Leave_room'),
				type: 'sidebar-item',
				id: 'leave',
				modifier: 'error',
			});
		}

		const config = {
			popoverClass: 'sidebar-item',
			columns: [
				{
					groups: [
						{
							items,
						},
					],
				},
			],
			data: {
				template: this.t,
				rid: this.rid,
				name: this.name,
			},
			currentTarget: e.currentTarget,
			offsetHorizontal: -e.currentTarget.clientWidth,
		};

		popover.open(config);
	},
});

Template.sidebarItemIcon.helpers({
	uid() {
		if (!this.room.rid) {
			return this.room._id;
		}
		return getUidDirectMessage(this.room.rid);
	},
	isRoom() {
		return this.room.rid || this.room._id;
	},
	status() {
		if (this.room.t === 'd') {
			return Session.get(`user_${ this.room.username }_status`) || 'offline';
		}

		if (this.room.t === 'l') {
			return roomTypes.getUserStatus('l', this.room.rid) || 'offline';
		}

		return false;
	},
});
