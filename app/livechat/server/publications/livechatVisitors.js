import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { hasPermission } from '../../../authorization';
import { LivechatVisitors } from '../../../models';

Meteor.publish('livechat:visitors', function(date) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:visitors' }));
	}

	if (!hasPermission(this.userId, 'view-livechat-manager')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:visitors' }));
	}

	date = {
		gte: new Date(date.gte),
		lt: new Date(date.lt),
	};

	check(date.gte, Date);
	check(date.lt, Date);

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
