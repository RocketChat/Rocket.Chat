import { Meteor } from 'meteor/meteor';
import { callbacks } from '../../callbacks';
import { settings } from '../../settings';
import { MentionsParser } from '../lib/MentionsParser';

const instance = new MentionsParser({
	pattern: () => settings.get('UTF8_Names_Validation'),
	useRealName: () => settings.get('UI_Use_Real_Name'),
	me: () => Meteor.userId() && Meteor.user().username,
});

callbacks.add('renderMessage', (message) => instance.parse(message), callbacks.priority.MEDIUM, 'mentions-message');
callbacks.add('renderMentions', (message) => instance.parse(message), callbacks.priority.MEDIUM, 'mentions-mentions');
