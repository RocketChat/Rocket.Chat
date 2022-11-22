import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { isTranslatedMessage } from '@rocket.chat/core-typings';

import { AutoTranslate } from './autotranslate';
import { settings } from '../../../settings/client';
import { hasAtLeastOnePermission } from '../../../authorization/client';
import { MessageAction } from '../../../ui-utils/client/lib/MessageAction';
import { messageArgs } from '../../../../client/lib/utils/messageArgs';
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
					if (
						!isTranslatedMessage(message) ||
						(!message.translations?.[language] && !message.attachments?.some((attachment) => attachment?.translations?.[language]))
					) {
						(AutoTranslate.messageIdsToWait as any)[message._id] = true;
						Messages.update({ _id: message._id }, { $set: { autoTranslateFetching: true } });
						Meteor.call('autoTranslate.translateMessage', message, language);
					}
					const action = 'autoTranslateShowInverse' in message ? '$unset' : '$set';
					Messages.update({ _id: message._id }, { [action]: { autoTranslateShowInverse: true } });
				},
				condition({ message, subscription, user }) {
					const language = subscription?.autoTranslateLanguage || '';
					const hasTranslationLanguage = isTranslatedMessage(message) && Boolean(message.translations?.[language]);
					const hasAttachmentTranslationLanguage = Boolean(message.attachments?.some((attachment) => attachment?.translations?.[language]));
					if (!user) {
						return false;
					}

					return Boolean(
						message?.u &&
							message.u._id !== user._id &&
							subscription?.autoTranslate &&
							((isTranslatedMessage(message) && message.autoTranslateShowInverse) ||
								(!hasTranslationLanguage && !hasAttachmentTranslationLanguage)),
					);
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
					if (
						!isTranslatedMessage(message) ||
						(!message.translations?.[language] && !message.attachments?.some((attachment) => attachment?.translations?.[language]))
					) {
						(AutoTranslate.messageIdsToWait as any)[message._id] = true;
						Messages.update({ _id: message._id }, { $set: { autoTranslateFetching: true } });
						Meteor.call('autoTranslate.translateMessage', message, language);
					}
					const action = 'autoTranslateShowInverse' in message ? '$unset' : '$set';
					Messages.update({ _id: message._id }, { [action]: { autoTranslateShowInverse: true } });
				},
				condition({ message, subscription, user }) {
					const language = subscription?.autoTranslateLanguage || '';
					const hasMessageTranslated = isTranslatedMessage(message) && Boolean(message.translations?.[language]);
					const hasAttachmentTranslated = message.attachments?.some((attachment) => attachment?.translations?.[language]);
					if (!user) {
						return false;
					}

					return Boolean(
						message?.u &&
							message.u._id !== user._id &&
							isTranslatedMessage(message) &&
							subscription?.autoTranslate &&
							!message.autoTranslateShowInverse &&
							(hasMessageTranslated || hasAttachmentTranslated),
					);
				},
				order: 90,
			});
		} else {
			MessageAction.removeButton('toggle-language');
		}
	});
});
