import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../authorization';
import { LivechatSessions } from '../../../models';

Meteor.publish('livechat:sessions', function(filter = {}) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:sessions' }));
	}

	if (!hasPermission(this.userId, 'view-livechat-manager')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:sessions' }));
	}

	check(filter, {
		name: Match.Maybe(String), // Visitor name
		status: Match.Maybe(String), // 'online', 'away', 'offline'
		chatStatus: Match.Maybe(String),
		fromTime: Match.Maybe(String),
		toTime: Match.Maybe(String),
		valueTime: Match.Maybe(String),
		from: Match.Maybe(String),
		to: Match.Maybe(String),
	});

	const self = this;
	Meteor.call('livechat:getSessionFilter', filter, function(err, query) {
		if (err) {
			return this.error(new Meteor.Error('error-not-authorized', err, { publish: 'livechat:sessions' }));
		}

		const handle = LivechatSessions.find(query).observeChanges({
			added(id, fields) {
				self.added('livechatSession', id, fields);
			},
			changed(id, fields) {
				self.changed('livechatSession', id, fields);
			},
			removed(id) {
				self.removed('livechatSession', id);
			},
		});

		self.ready();

		self.onStop(function() {
			handle.stop();
		});
	});
});
