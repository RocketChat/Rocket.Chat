import { Meteor } from 'meteor/meteor';

import { hasPermission, hasRole } from '../../../authorization';
import { LivechatInquiry } from '../../lib/LivechatInquiry';
import { settings } from '../../../settings';
import { LivechatDepartment, LivechatDepartmentAgents } from '../../../models/server';

Meteor.publish('livechat:inquiry', function(_id) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:inquiry' }));
	}

	if (!hasPermission(this.userId, 'view-l-room')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:inquiry' }));
	}

	const publication = this;
	const limit = settings.get('Livechat_guest_pool_max_number_incoming_livechats_displayed');
	let departmentIds;
	if (!hasRole(this.userId, 'livechat-manager')) {
		const departmentAgents = LivechatDepartmentAgents.findByAgentId(this.userId).fetch().map((d) => d.departmentId);
		departmentIds = LivechatDepartment.find({ _id: { $in: departmentAgents }, enabled: true }).fetch().map((d) => d._id);
	}

	const filter = {
		status: 'open',
		..._id && { _id },
		...departmentIds && { department: { $in: departmentIds } },
	};

	const options = {
		...limit && { limit },
	};

	const cursorHandle = LivechatInquiry.find(filter, options).observeChanges({
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
