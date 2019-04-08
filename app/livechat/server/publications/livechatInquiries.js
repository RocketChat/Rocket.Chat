import { Meteor } from 'meteor/meteor';
import { hasPermission } from '../../../authorization';
import { LivechatInquiry } from '../../lib/LivechatInquiry';

Meteor.publish('livechat:inquiry', function() {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:inquiry' }));
	}

	if (!hasPermission(this.userId, 'view-l-room')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:inquiry' }));
	}

	const query = {
		agents: this.userId,
		status: 'open',
	};

	return LivechatInquiry.find(query);
});
