import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { isTranslatedMessage } from '@rocket.chat/core-typings';

import { AutoTranslate } from './autotranslate';
import { settings } from '../../../settings/client';
import { hasAtLeastOnePermission } from '../../../authorization/client';
import { MessageAction } from '../../../ui-utils/client/lib/MessageAction';
import { messageArgs } from '../../../ui-utils/client/lib/messageArgs';
import { Messages } from '../../../models/client';

Meteor.startup(() => {
	AutoTranslate.init();

	Tracker.autorun(() => {
		if (settings.get('AutoTranslate_Enabled') && hasAtLeastOnePermission(['auto-translate'])) {
			MessageAction.addButton({
				id: 'translate',
				icon: 'language',
				label: 'Translate',
				context: ['message', 'message-mobile', 'threads'],
				action(_, props) {
					const { message = messageArgs(this).msg } = props;
					const language = AutoTranslate.getLanguage(message.rid);
					if (!isTranslatedMessage(message) || !message.translations[language]) {
						// } && !_.find(message.attachments, attachment => { return attachment.translations && attachment.translations[language]; })) {
						(AutoTranslate.messageIdsToWait as any)[message._id] = true;
						Messages.update({ _id: message._id }, { $set: { autoTranslateFetching: true } });
						Meteor.call('autoTranslate.translateMessage', message, language);
					}
					const action = 'autoTranslateShowInverse' in message ? '$unset' : '$set';
					Messages.update({ _id: message._id }, { [action]: { autoTranslateShowInverse: true } });
				},
				condition({ message, user }) {
					return Boolean(message?.u && message.u._id !== user._id && isTranslatedMessage(message) && !message.translations.original);
				},
				order: 90,
			});
			MessageAction.addButton({
				id: 'view-original',
				icon: 'language',
				label: 'View_original',
				context: ['message', 'message-mobile', 'threads'],
				action(_, props) {
					const { message = messageArgs(this).msg } = props;
					const language = AutoTranslate.getLanguage(message.rid);
					if (!isTranslatedMessage(message) || !message.translations[language]) {
						// } && !_.find(message.attachments, attachment => { return attachment.translations && attachment.translations[language]; })) {
						(AutoTranslate.messageIdsToWait as any)[message._id] = true;
						Messages.update({ _id: message._id }, { $set: { autoTranslateFetching: true } });
						Meteor.call('autoTranslate.translateMessage', message, language);
					}
					const action = 'autoTranslateShowInverse' in message ? '$unset' : '$set';
					Messages.update({ _id: message._id }, { [action]: { autoTranslateShowInverse: true } });
				},
				condition({ message, user }) {
					return Boolean(message?.u && message.u._id !== user._id && isTranslatedMessage(message) && message.translations.original);
				},
				order: 90,
			});
		} else {
			MessageAction.removeButton('toggle-language');
		}
	});
});
