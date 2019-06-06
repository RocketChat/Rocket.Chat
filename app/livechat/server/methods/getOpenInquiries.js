import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { LivechatInquiry } from '../../lib/LivechatInquiry';

Meteor.methods({
	'livechat:getOpenInquiries'(department) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-l-room')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:takeInquiry' });
		}

		let inquiries;
		if (department) {
			inquiries = LivechatInquiry.find({ department, status: 'open', t: 'l' });
		} else {
			inquiries = LivechatInquiry.find({ status: 'open', t: 'l' });
		}

		return inquiries.map((inquiry) => inquiry);
	},
});
