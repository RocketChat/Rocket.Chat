import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { hasPermission } from 'meteor/rocketchat:authorization';
import { Rooms } from 'meteor/rocketchat:models';

Meteor.publish('livechat:monitoring', function(date) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:monitoring' }));
	}

	if (!hasPermission(this.userId, 'view-livechat-manager')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:monitoring' }));
	}

	date = {
		gte: new Date(date.gte),
		lt: new Date(date.lt),
	};

	check(date.gte, Date);
	check(date.lt, Date);

	const self = this;

	const handle = Rooms.getAnalyticsMetricsBetweenDate('l', date).observeChanges({
		added(id, fields) {
			self.added('livechatMonitoring', id, fields);
		},
		changed(id, fields) {
			self.changed('livechatMonitoring', id, fields);
		},
		removed(id) {
			self.removed('livechatMonitoring', id);
		},
	});

	self.ready();

	self.onStop(function() {
		handle.stop();
	});
});
