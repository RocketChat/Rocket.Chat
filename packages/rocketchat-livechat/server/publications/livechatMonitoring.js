import moment from 'moment';

Meteor.publish('livechat:monitoring', function(date) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:monitoring' }));
	}

	date = {
		gte: moment(date.gte, 'MMM D YYYY'),
		lt: moment(date.lt, 'MMM D YYYY'),
	};

	if (!(moment(date.gte).isValid() && moment(date.lt).isValid())) {
		console.log('Invalid dates');
		return;
	}

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
		},
	});

	self.ready();

	self.onStop(function() {
		handle.stop();
	});
});
