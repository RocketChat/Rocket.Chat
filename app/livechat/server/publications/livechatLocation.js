import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../authorization';
import { LivechatSessions } from '../../../models';

Meteor.publish('livechat:location', function(filter = {}) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:location' }));
	}

	if (!hasPermission(this.userId, 'view-livechat-manager')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:location' }));
	}

	check(filter, {
		name: Match.Maybe(String), // Visitor name
		state: Match.Maybe(String), // 'active', 'registered', or 'idle'
	});

	let query = {};
	if (filter.name) {
		query['visitorInfo.name'] = new RegExp(filter.name, 'i');
	}
	if (filter.state) {
		if (filter.state === 'active') {
			query.state = 'active';
		} else if (filter.state === 'registered') {
			query.state = 'registered';
		} else if (filter.state === 'idle') {
			query.state = 'idle';
		} else {
			query = {};
		}
	}

	const self = this;

	const handle = LivechatSessions.find(query).observeChanges({
		added(id, fields) {
			self.added('livechatLocation', id, fields);
		},
		changed(id, fields) {
			self.changed('livechatLocation', id, fields);
		},
		removed(id) {
			self.removed('livechatLocation', id);
		},
	});

	self.ready();

	self.onStop(function() {
		handle.stop();
	});
});
