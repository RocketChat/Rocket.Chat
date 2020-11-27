import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { callbacks } from '../../../app/callbacks';
import { settings } from '../../../app/settings';
import { Users } from '../../../app/models/client';

Meteor.startup(() => {
	Tracker.autorun(async () => {
		const { createMentionsMessageRenderer } = await import('../../../app/mentions/client');

		const uid = Meteor.userId();
		const renderMessage = createMentionsMessageRenderer({
			me: uid && (Users.findOne(uid, { fields: { username: 1 } }) || {}).username,
			pattern: settings.get('UTF8_Names_Validation'),
			useRealName: settings.get('UI_Use_Real_Name'),
		});

		callbacks.add('renderMessage', renderMessage, callbacks.priority.MEDIUM, 'mentions-message');
	});
});
