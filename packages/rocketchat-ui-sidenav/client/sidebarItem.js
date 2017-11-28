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
		return Template.instance().renderedMessage;
	},
	lastMessageTs() {
		return Template.instance().lastMessageTs.get();
	},
	colorStyle() {
		return `background-color: ${ RocketChat.getAvatarColor(this.name) }`;
	},
	timeAgo(time) {
		if (!time) {
			return;
		}
	}
});

Template.sidebarItem.onCreated(function() {
	function timeAgo(time) {
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
				const sender = Meteor.userId() === currentData.lastMessage.u._id ? t('You') : currentData.lastMessage.u.username;
				if (currentData.lastMessage.msg === '') {
					this.renderedMessage = t('sent_an_attachment', {user: sender});
				} else {
					this.renderedMessage = `${ sender }: ${ renderMessageBody(currentData.lastMessage) }`;
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
