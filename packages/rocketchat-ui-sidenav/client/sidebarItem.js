/* globals menu popover renderMessageBody */
Template.sidebarItem.helpers({
	or(...args) {
		args.pop();
		return args.some(arg => arg);
	},
	isRoom() {
		return this.rid || this._id;
	},
	lastMessage() {
		if (this.lastMessage) {
			if (this.lastMessage._id) {
				const sender = Meteor.userId() === this.lastMessage.u._id ? t('You') : this.lastMessage.u.username;
				if (this.lastMessage.msg === '') {
					this.lastMessage.renderedMessage = t('sent_an_attachment', {user: sender});
				} else {
					this.lastMessage.renderedMessage = `${ sender }: ${ renderMessageBody(this.lastMessage) }`;
				}
			} else {
				this.lastMessage.renderedMessage = this.lastMessage.msg;
			}

			return this.lastMessage;
		}

		return false;
	},
	colorStyle() {
		return `background-color: ${ RocketChat.getAvatarColor(this.name) }`;
	},
	timeAgo(time) {
		if (!time) {
			return;
		}
		const templates = {
			minutes: '%dm',
			hours: '%dh',
			days: '%dd',
			months: '%dm',
			years: '%dy'
		};
		const template = function(t, n) {
			return templates[t] && templates[t].replace(/%d/i, Math.abs(Math.round(n)));
		};

		const now = new Date();
		const seconds = ((now.getTime() - time) * .001) >> 0;
		const minutes = seconds / 60;
		const hours = minutes / 60;
		const days = hours / 24;
		const years = days / 365;

		return (
			seconds < 90 && template('minutes', 1) ||
			minutes < 45 && template('minutes', minutes) ||
			minutes < 90 && template('hours', 1) ||
			hours < 24 && template('hours', hours) ||
			hours < 42 && template('days', 1) ||
			days < 30 && template('days', days) ||
			days < 45 && template('months', 1) ||
			days < 365 && template('months', days / 30) ||
			years < 1.5 && template('years', 1) ||
			template('years', years)
		);
	}
});

Template.sidebarItem.events({
	'click [data-id], click .sidebar-item__link'() {
		return menu.close();
	},
	'click .sidebar-item__menu'(e) {
		const canLeave = () => {
			const roomData = Session.get(`roomData${ this.rid }`);

			if (!roomData) { return false; }

			return !(((roomData.cl != null) && !roomData.cl) || (['d', 'l'].includes(roomData.t)));
		};
		e.preventDefault();
		const items = [{
			icon: 'eye-off',
			name: t('Hide_room'),
			type: 'sidebar-item',
			id: 'hide'
		}];
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
