import type { IEditedMessage } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import moment from 'moment';

import { hasAtLeastOnePermission, hasPermission } from '../../app/authorization/client';
import { ChatMessage } from '../../app/models/client';
import { settings } from '../../app/settings/client';
import { t } from '../../app/utils/lib/i18n';
import { dispatchToastMessage } from '../lib/toast';

Meteor.methods<ServerMethods>({
	updateMessage(message) {
		const uid = Meteor.userId();
		if (!uid) {
			return;
		}

		const originalMessage = ChatMessage.findOne(message._id);

		if (!originalMessage) {
			return;
		}
		const canEditMessage = hasAtLeastOnePermission('edit-message', message.rid);
		const editAllowed = settings.get('Message_AllowEditing');
		let editOwn = false;

		const msgText = originalMessage?.attachments?.[0]?.description ?? originalMessage.msg;

		if (msgText === message.msg) {
			return;
		}
		if (originalMessage?.u?._id) {
			editOwn = originalMessage.u._id === uid;
		}

		const me = Meteor.users.findOne(uid);

		if (!me) {
			return;
		}

		if (!(canEditMessage || (editAllowed && editOwn))) {
			dispatchToastMessage({
				type: 'error',
				message: t('error-action-not-allowed', { action: t('Message_editing') }),
			});
			return;
		}

		const blockEditInMinutes = Number(settings.get('Message_AllowEditing_BlockEditInMinutes') as number | undefined);
		const bypassBlockTimeLimit = hasPermission('bypass-time-limit-edit-and-delete', message.rid);

		if (!bypassBlockTimeLimit && blockEditInMinutes !== 0) {
			if (originalMessage.ts) {
				const msgTs = moment(originalMessage.ts);
				if (msgTs) {
					const currentTsDiff = moment().diff(msgTs, 'minutes');
					if (currentTsDiff > blockEditInMinutes) {
						dispatchToastMessage({ type: 'error', message: t('error-message-editing-blocked') });
						return;
					}
				}
			}
		}

		Tracker.nonreactive(async () => {
			message.editedAt = new Date(Date.now());

			message.editedBy = {
				_id: uid,
				username: me.username,
			};

			const messageObject: Partial<IEditedMessage> = {
				editedAt: message.editedAt,
				editedBy: message.editedBy,
				msg: message.msg,
			};

			if (originalMessage.attachments?.length) {
				if (originalMessage.attachments[0].description !== undefined) {
					delete messageObject.msg;
					originalMessage.attachments[0].description = message.msg;
				}
			}
			ChatMessage.update(
				{
					'_id': message._id,
					'u._id': uid,
				},
				{ $set: messageObject },
			);
		});
	},
});
