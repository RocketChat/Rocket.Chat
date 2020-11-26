import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { callbacks } from '../../callbacks';
import { settings } from '../../settings';
import { Users } from '../../models/client';
import { MentionsParser } from '../lib/MentionsParser';

export let instance = new MentionsParser({
	me: () => undefined,
	pattern: () => undefined,
	useRealName: () => undefined,
});

const createMentionsMessageRenderer = ({
	me,
	pattern,
	useRealName,
}) => {
	instance = new MentionsParser({
		me: () => me,
		pattern: () => pattern,
		useRealName: () => useRealName,
	});

	return (message) => instance.parse(message);
};

export let renderMentions = (message) => message;

Meteor.startup(() => {
	Tracker.autorun(() => {
		const uid = Meteor.userId();
		const me = uid && (Users.findOne(uid, { fields: { username: 1 } }) || {}).username;
		const pattern = settings.get('UTF8_Names_Validation');
		const useRealName = settings.get('UI_Use_Real_Name');

		const renderMessage = createMentionsMessageRenderer({
			me,
			pattern,
			useRealName,
		});
		renderMentions = renderMessage;

		callbacks.add('renderMessage', renderMessage, callbacks.priority.MEDIUM, 'mentions-message');
	});
});
