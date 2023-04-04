import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { AutoTranslate } from './autotranslate';
import { settings } from '../../../settings/client';
import { hasAtLeastOnePermission } from '../../../authorization/client';
import { MessageAction } from '../../../ui-utils/client/lib/MessageAction';
import { messageArgs } from '../../../../client/lib/utils/messageArgs';
import { Messages } from '../../../models/client';
import {
	hasTranslationLanguageInAttachments,
	hasTranslationLanguageInMessage,
} from '../../../../client/views/room/MessageList/lib/autoTranslate';
import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';

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
					if (!hasTranslationLanguageInMessage(message, language) && !hasTranslationLanguageInAttachments(message.attachments, language)) {
						(AutoTranslate.messageIdsToWait as any)[message._id] = true;
						Messages.update({ _id: message._id }, { $set: { autoTranslateFetching: true } });
						Meteor.call('autoTranslate.translateMessage', message, language);
					}
					const action = 'autoTranslateShowInverse' in message ? '$unset' : '$set';
					Messages.update({ _id: message._id }, { [action]: { autoTranslateShowInverse: true } });
				},
				condition({ message, subscription, user, room }) {
					if (!user) {
						return false;
					}
					const language = subscription?.autoTranslateLanguage || AutoTranslate.getLanguage(message.rid) || '';
					const isLivechatRoom = roomCoordinator.isLivechatRoom(room?.t);
					const isDifferentUser = message?.u && message.u._id !== user._id;
					const autoTranslateEnabled = subscription?.autoTranslate || isLivechatRoom;
					const hasLanguage =
						hasTranslationLanguageInMessage(message, language) || hasTranslationLanguageInAttachments(message.attachments, language);

					return Boolean(
						(message as { autoTranslateShowInverse?: boolean }).autoTranslateShowInverse ||
							(isDifferentUser && autoTranslateEnabled && !hasLanguage),
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
					if (!hasTranslationLanguageInMessage(message, language) && !hasTranslationLanguageInAttachments(message.attachments, language)) {
						(AutoTranslate.messageIdsToWait as any)[message._id] = true;
						Messages.update({ _id: message._id }, { $set: { autoTranslateFetching: true } });
						Meteor.call('autoTranslate.translateMessage', message, language);
					}
					const action = 'autoTranslateShowInverse' in message ? '$unset' : '$set';
					Messages.update({ _id: message._id }, { [action]: { autoTranslateShowInverse: true } });
				},
				condition({ message, subscription, user, room }) {
					const language = subscription?.autoTranslateLanguage || AutoTranslate.getLanguage(message.rid) || '';
					const isLivechatRoom = roomCoordinator.isLivechatRoom(room?.t);
					if (!user) {
						return false;
					}
					const isDifferentUser = message?.u && message.u._id !== user._id;
					const autoTranslateEnabled = subscription?.autoTranslate || isLivechatRoom;
					const hasLanguage =
						hasTranslationLanguageInMessage(message, language) || hasTranslationLanguageInAttachments(message.attachments, language);

					return Boolean(
						!(message as { autoTranslateShowInverse?: boolean }).autoTranslateShowInverse &&
							isDifferentUser &&
							autoTranslateEnabled &&
							hasLanguage,
					);
				},
				order: 90,
			});
		} else {
			MessageAction.removeButton('toggle-language');
		}
	});
});
