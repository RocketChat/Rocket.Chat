import moment from 'moment';

Template.privateHistory.helpers({
	history() {
		const items = ChatSubscription.find({
			name: {
				$regex: Session.get('historyFilter'),
				$options: 'i'
			},
			t: {
				$in: ['d', 'c', 'p']
			},
			archived: {
				$ne: true
			}
		}, {
			'sort': {
				'ts': -1
			}
		});
		return {
			items,
			length: items.count()
		};
	},
	archivedHistory() {
		const items = ChatSubscription.find({
			name: {
				$regex: Session.get('historyFilter'),
				$options: 'i'
			},
			t: {
				$in: ['d', 'c', 'p']
			},
			archived: true
		}, {
			'sort': {
				'ts': -1
			}
		});
		return {
			items,
			length: items.count()
		};
	},
	roomOf(rid) {
		return ChatRoom.findOne(rid);
	},
	type() {
		switch (this.t) {
			case 'd':
				return 'icon-at';
			case 'c':
				return 'icon-hash';
			case 'p':
				return 'icon-lock';
		}
	},
	creation() {
		return moment(this.ts).format('LLL');
	},
	lastMessage() {
		if (this.lm) {
			return moment(this.lm).format('LLL');
		}
	},
	path() {
		switch (this.t) {
			case 'c':
				return FlowRouter.path('channel', {
					name: this.name
				});
			case 'p':
				return FlowRouter.path('group', {
					name: this.name
				});
			case 'd':
				return FlowRouter.path('direct', {
					username: this.name
				});
		}
	}
});

Template.privateHistory.events({
	'keydown #history-filter'(event) {
		if (event.which === 13) {
			event.stopPropagation();
			return event.preventDefault();
		}
	},
	'keyup #history-filter'(event) {
		event.stopPropagation();
		event.preventDefault();
		return Session.set('historyFilter', event.currentTarget.value);
	}
});
