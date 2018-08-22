import moment from 'moment';
import LivechatVisitors from '../models/LivechatVisitors';

Meteor.publish('livechat:visitors', function(date) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:visitors' }));
	}

	date = {
		gte: moment(date.gte, 'MMM D YYYY'),
		lt: moment(date.lt, 'MMM D YYYY'),
	};

	if (!(moment(date.gte).isValid() && moment(date.lt).isValid())) {
		console.log('livechat:visitors => Invalid dates');
		return;
	}

	const self = this;

	const handle = LivechatVisitors.getVisitorsBetweenDate(date).observeChanges({
		added(id, fields) {
			self.added('livechatVisitors', id, fields);
		},
		changed(id, fields) {
			self.changed('livechatVisitors', id, fields);
		},
		removed(id) {
			self.removed('livechatVisitors', id);
		},
	});

	self.ready();

	self.onStop(function() {
		handle.stop();
	});
});
