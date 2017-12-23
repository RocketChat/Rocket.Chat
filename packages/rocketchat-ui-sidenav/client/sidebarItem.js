/* globals menu popover renderMessageBody */
import moment from 'moment';

Template.sidebarItem.helpers({
	or(...args) {
		args.pop();
		return args.some(arg => arg);
	},
	isRoom() {
		return this.rid || this._id;
	},
	lastMessage() {
		return this.lastMessage && Template.instance().renderedMessage;
	},
	lastMessageTs() {
		return this.lastMessage && Template.instance().lastMessageTs.get();
	},
	colorStyle() {
		return `background-color: ${ RocketChat.getAvatarColor(this.name) }`;
	},
	mySelf() {
		return this.t === 'd' && this.name === Meteor.user().username;
	}
});

Template.sidebarItem.onCreated(function() {
	function timeAgo(time) {
		const now = new Date();
		const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

		return (
			now.getDate() === time.getDate() && moment(time).format('LT') ||
			yesterday.getDate() === time.getDate() && t('yesterday') ||
			moment(time).format('L')
		);
	}

	this.lastMessageTs = new ReactiveVar();
	this.timeAgoInterval;
	function setLastMessageTs(instance, ts) {
		if (instance.timeAgoInterval) {
			Meteor.clearInterval(instance.timeAgoInterval);
		}

		instance.lastMessageTs.set(timeAgo(ts));

		instance.timeAgoInterval = Meteor.setInterval(() => {
			instance.lastMessageTs.set(timeAgo(ts));
		}, 60000);
	}

	this.autorun(() => {
		const currentData = Template.currentData();

		if (currentData.lastMessage) {
			if (currentData.lastMessage._id) {
				const otherUser = RocketChat.settings.get('UI_Use_Real_Name') ? currentData.lastMessage.u.name || currentData.lastMessage.u.username : currentData.lastMessage.u.username;
				const renderedMessage = renderMessageBody(currentData.lastMessage);
				const sender = Meteor.userId() === currentData.lastMessage.u._id ? t('You') : otherUser;

				if (currentData.t === 'd' && Meteor.userId() !== currentData.lastMessage.u._id) {
					this.renderedMessage = currentData.lastMessage.msg === '' ? t('Sent_an_attachment') : renderedMessage;
				} else {
					this.renderedMessage = currentData.lastMessage.msg === '' ? t('user_sent_an_attachment', {user: sender}) : `${ sender }: ${ renderedMessage }`;
				}

				setLastMessageTs(this, currentData.lastMessage.ts);
			} else {
				this.renderedMessage = currentData.lastMessage.msg;
			}
		}
	});
});

Template.sidebarItem.events({
	'click [data-id], click .sidebar-item__link'() {
		return menu.close();
	},
	'click .sidebar-item__menu'(e) {
		e.preventDefault();

		const canLeave = () => {
			const roomData = Session.get(`roomData${ this.rid }`);

			if (!roomData) { return false; }

			return !(((roomData.cl != null) && !roomData.cl) || (['d', 'l'].includes(roomData.t)));
		};

		const canFavorite = RocketChat.settings.get('Favorite_Rooms') && ChatSubscription.find({ rid: this.rid }).count() > 0;
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
			id: 'hide'
		}];

		if (this.alert) {
			items.push({
				icon: 'flag',
				name: t('Mark_as_read'),
				type: 'sidebar-item',
				id: 'read'
			});
		}

		if (canFavorite) {
			items.push({
				icon: 'star',
				name: t(isFavorite() ? 'Unfavorite' : 'Favorite'),
				modifier: isFavorite() ? 'star-filled' : 'star',
				type: 'sidebar-item',
				id: 'favorite'
			});
		}

		if (canLeave()) {
			items.push({
				icon: 'sign-out',
				name: t('Leave_room'),
				type: 'sidebar-item',
				id: 'leave',
				modifier: 'error'
			});
		}

		const config = {
			popoverClass: 'sidebar-item',
			columns: [
				{
					groups: [
						{
							items
						}
					]
				}
			],
			mousePosition: {
				x: e.clientX,
				y: e.clientY
			},
			data: {
				template: this.t,
				rid: this.rid,
				name: this.name
			}
		};

		popover.open(config);
	}
});
