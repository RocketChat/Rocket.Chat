import moment from 'moment';
import LivechatVisitors from '../models/LivechatVisitors';

Meteor.publish('livechat:visitors', function() {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:visitors' }));
	}

	const date = {
		gte: moment().startOf('day'),
		lt: moment().startOf('day').add(1, 'days')
	};

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
		}
	});

	self.ready();

	self.onStop(function() {
		handle.stop();
	});
});
