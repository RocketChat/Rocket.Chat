import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { settings } from '../../../settings';
import { hasAtLeastOnePermission } from '../../../authorization';
import { MessageAction } from '../../../ui-utils';
import { Messages } from '../../../models';
import { AutoTranslate } from './autotranslate';

Meteor.startup(function() {
	Tracker.autorun(function() {
		if (settings.get('AutoTranslate_Enabled') && hasAtLeastOnePermission(['auto-translate'])) {
			MessageAction.addButton({
				id: 'toggle-language',
				icon: 'language',
				label: 'Toggle_original_translated',
				context: [
					'message',
					'message-mobile',
				],
				action() {
					const message = this._arguments[1];
					const language = AutoTranslate.getLanguage(message.rid);
					if ((!message.translations || !message.translations[language])) { // } && !_.find(message.attachments, attachment => { return attachment.translations && attachment.translations[language]; })) {
						AutoTranslate.messageIdsToWait[message._id] = true;
						Messages.update({ _id: message._id }, { $set: { autoTranslateFetching: true } });
						Meteor.call('autoTranslate.translateMessage', message, language);
					} else if (message.autoTranslateShowInverse) {
						Messages.update({ _id: message._id }, { $unset: { autoTranslateShowInverse: true } });
					} else {
						Messages.update({ _id: message._id }, { $set: { autoTranslateShowInverse: true } });
					}
				},
				condition(message) {
					return message && message.u && message.u._id !== Meteor.userId();
				},
				order: 90,
			});
		} else {
			MessageAction.removeButton('toggle-language');
		}
	});
});
