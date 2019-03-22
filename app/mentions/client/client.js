import { Meteor } from 'meteor/meteor';
import { callbacks } from '../../callbacks';
import { settings } from '../../settings';
import Mentions from '../lib/Mentions';

const MentionsClient = new Mentions({
	pattern() {
		return settings.get('UTF8_Names_Validation');
	},
	useRealName() {
		return settings.get('UI_Use_Real_Name');
	},
	me() {
		const me = Meteor.user();
		return me && me.username;
	},
});

callbacks.add('renderMessage', (message) => MentionsClient.parse(message), callbacks.priority.MEDIUM, 'mentions-message');
callbacks.add('renderMentions', (message) => MentionsClient.parse(message), callbacks.priority.MEDIUM, 'mentions-mentions');
