import moment from 'moment';

Meteor.publish('livechat:monitoring', function() {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:monitoring' }));
	}

	const date = {
		gte: moment().startOf('day'),
		lt: moment().startOf('day').add(1, 'days')
	};

	const self = this;

	const handle = RocketChat.models.Rooms.getAnalyticsMetricsBetweenDate('l', date).observeChanges({
		added(id, fields) {
			self.added('livechatMonitoring', id, fields);
		},
		changed(id, fields) {
			self.changed('livechatMonitoring', id, fields);
		},
		removed(id) {
			self.removed('livechatMonitoring', id);
		}
	});

	self.ready();

	self.onStop(function() {
		handle.stop();
	});
});
