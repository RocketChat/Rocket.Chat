import { Meteor } from 'meteor/meteor';
import { Rooms } from '/app/models';
import AutoTranslate from '../autotranslate';

Meteor.methods({
	'autoTranslate.translateMessage'(message, targetLanguage) {
		const room = Rooms.findOneById(message && message.rid);
		if (message && room && AutoTranslate) {
			return AutoTranslate.translateMessage(message, room, targetLanguage);
		}
	},
});
