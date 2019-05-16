import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { LivechatInquiry } from '../../lib/LivechatInquiry';

Meteor.publish('livechat:inquiry', function(_id) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:inquiry' }));
	}

	if (!hasPermission(this.userId, 'view-l-room')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:inquiry' }));
	}

	const publication = this;

	const cursorHandle = LivechatInquiry.find({
		agents: this.userId,
		status: 'open',
		..._id && { _id },
	}).observeChanges({
		added(_id, record) {
			return publication.added('rocketchat_livechat_inquiry', _id, record);
		},
		changed(_id, record) {
			return publication.changed('rocketchat_livechat_inquiry', _id, record);
		},
		removed(_id) {
			return publication.removed('rocketchat_livechat_inquiry', _id);
		},
	});

	this.ready();
	return this.onStop(function() {
		return cursorHandle.stop();
	});
});
