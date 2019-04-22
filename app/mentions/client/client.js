import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { callbacks } from '../../callbacks';
import { settings } from '../../settings';
import { MentionsParser } from '../lib/MentionsParser';

let me;
let useRealName;
let pattern;

Meteor.startup(() => Tracker.autorun(() => {
	me = Meteor.userId() && Meteor.user().username;
	pattern = settings.get('UTF8_Names_Validation');
	useRealName = settings.get('UI_Use_Real_Name');
}));


const instance = new MentionsParser({
	pattern: () => pattern,
	useRealName: () => useRealName,
	me: () => me,
});

callbacks.add('renderMessage', (message) => instance.parse(message), callbacks.priority.MEDIUM, 'mentions-message');
callbacks.add('renderMentions', (message) => instance.parse(message), callbacks.priority.MEDIUM, 'mentions-mentions');
