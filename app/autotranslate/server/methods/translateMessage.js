import { Meteor } from 'meteor/meteor';
import { Rooms } from '../../../models';
import { TranslationProviderRegistry } from '..';

Meteor.methods({
	'autoTranslate.translateMessage'(message, targetLanguage) {
		const room = Rooms.findOneById(message && message.rid);
		if (message && room && TranslationProviderRegistry) {
			TranslationProviderRegistry.getActiveProvider().translateMessage(message, room, targetLanguage);
		}
	},
});
