import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { Users } from '../../../app/models/client';
import { settings } from '../../../app/settings/client';
import { shouldUseRealName } from '../../../app/utils/lib/shouldUseRealName';
import { callbacks } from '../../../lib/callbacks';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const uid = Meteor.userId();
		const user = uid ? Users.findOne(uid, { fields: { settings: 1, username: 1 } }) : null;
		const defaultMessagesLayout = settings.get('Accounts_Default_User_Preferences_messagesLayout');
		const options = {
			me: uid && user?.username,
			pattern: settings.get('UTF8_User_Names_Validation'),
			useRealName: shouldUseRealName(defaultMessagesLayout, user),
		};

		import('../../../app/mentions/client').then(({ createMentionsMessageRenderer }) => {
			const renderMessage = createMentionsMessageRenderer(options);
			callbacks.remove('renderMessage', 'mentions-message');
			callbacks.add('renderMessage', renderMessage, callbacks.priority.MEDIUM, 'mentions-message');
		});
	});
});
