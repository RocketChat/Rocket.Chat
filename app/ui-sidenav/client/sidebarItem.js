import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import { t, getUserPreference, roomTypes } from '../../utils';
import { popover, renderMessageBody, menu } from '../../ui-utils';
import { Users, ChatSubscription } from '../../models';
import { settings } from '../../settings';
import { hasAtLeastOnePermission } from '../../authorization';
import { timeAgo } from '../../lib/client/lib/formatDate';

Template.sidebarItem.helpers({
	streaming() {
		return this.streamingOptions && Object.keys(this.streamingOptions).length;
	},
	isNewsfeed() {
		return this.t === 'n';
	},
	isRoom() {
		return this.rid || this._id;
	},
	isExtendedViewMode() {
		return getUserPreference(Meteor.userId(), 'sidebarViewMode') === 'extended';
	},
	lastMessage() {
		return this.lastMessage && Template.instance().renderedMessage;
	},
	lastMessageTs() {
		return this.lastMessage && Template.instance().lastMessageTs.get();
	},
	mySelf() {
		return this.t === 'd' && this.name === Template.instance().user.username;
	},
	isLivechatQueue() {
		return this.pathSection === 'livechat-queue';
	},
	showUnread() {
		return this.unread > 0 || (!this.hideUnreadStatus && this.alert);
	},
	badgeClass() {
		const { t, unread, userMentions, groupMentions } = this;

		const badges = ['badge'];

		if (unread) {
			badges.push('badge--unread');
			if (t === 'd') {
				badges.push('badge--dm');
			}
		}

		if (userMentions) {
			badges.push('badge--user-mentions');
		} else if (groupMentions) {
			badges.push('badge--group-mentions');
		}

		return badges.join(' ');
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
	this.user = Users.findOne(Meteor.userId(), { fields: { username: 1 } });

	this.lastMessageTs = new ReactiveVar();
	this.timeAgoInterval;

	// console.log('sidebarItem.onCreated');

	this.autorun(() => {
		const currentData = Template.currentData();

		if (!currentData.lastMessage || getUserPreference(Meteor.userId(), 'sidebarViewMode') !== 'extended') {
			return clearInterval(this.timeAgoInterval);
		}

		if (!currentData.lastMessage._id) {
			this.renderedMessage = currentData.lastMessage.msg;
			return;
		}

		setLastMessageTs(this, currentData.lastMessage.ts);

		if (currentData.lastMessage.t === 'e2e' && currentData.lastMessage.e2e !== 'done') {
			this.renderedMessage = '******';
			return;
		}

		const otherUser = settings.get('UI_Use_Real_Name') ? currentData.lastMessage.u.name || currentData.lastMessage.u.username : currentData.lastMessage.u.username;
		const renderedMessage = renderMessageBody(currentData.lastMessage).replace(/<br\s?\\?>/g, ' ');
		const sender = this.user._id === currentData.lastMessage.u._id ? t('You') : otherUser;

		if (currentData.t === 'd' && Meteor.userId() !== currentData.lastMessage.u._id) {
			this.renderedMessage = currentData.lastMessage.msg === '' ? t('Sent_an_attachment') : renderedMessage;
		} else {
			this.renderedMessage = currentData.lastMessage.msg === '' ? t('user_sent_an_attachment', { user: sender }) : `${ sender }: ${ renderedMessage }`;
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

		const canFavorite = settings.get('Favorite_Rooms') && ChatSubscription.find({ rid: this.rid }).count() > 0;
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
	isRoom() {
		return this.rid || this._id;
	},
	status() {
		if (this.t === 'd') {
			return Session.get(`user_${ this.username }_status`) || 'offline';
		}

		if (this.t === 'l') {
			return roomTypes.getUserStatus('l', this.rid) || 'offline';
		}

		return false;
	},
});
