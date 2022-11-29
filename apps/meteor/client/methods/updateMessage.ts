import { IEditedMessage } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import moment from 'moment';
import _ from 'underscore';

import { hasAtLeastOnePermission } from '../../app/authorization/client';
import { ChatMessage } from '../../app/models/client';
import { settings } from '../../app/settings/client';
import { t } from '../../app/utils/client';
import { callbacks } from '../../lib/callbacks';
import { dispatchToastMessage } from '../lib/toast';

Meteor.methods({
	updateMessage(message) {
		const uid = Meteor.userId();
		if (!uid) {
			return false;
		}

		const originalMessage = ChatMessage.findOne(message._id);

		if (!originalMessage) {
			return;
		}
		const hasPermission = hasAtLeastOnePermission('edit-message', message.rid);
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
			return false;
		}

		if (!(hasPermission || (editAllowed && editOwn))) {
			dispatchToastMessage({
				type: 'error',
				message: t('error-action-not-allowed', { action: t('Message_editing') }),
			});
			return false;
		}

		const blockEditInMinutes = settings.get('Message_AllowEditing_BlockEditInMinutes');
		if (_.isNumber(blockEditInMinutes) && blockEditInMinutes !== 0) {
			if (originalMessage.ts) {
				const msgTs = moment(originalMessage.ts);
				if (msgTs) {
					const currentTsDiff = moment().diff(msgTs, 'minutes');
					if (currentTsDiff > blockEditInMinutes) {
						dispatchToastMessage({ type: 'error', message: t('error-message-editing-blocked') });
						return false;
					}
				}
			}
		}

		Tracker.nonreactive(() => {
			message.editedAt = new Date(Date.now());

			message.editedBy = {
				_id: uid,
				username: me.username,
			};

			message = callbacks.run('beforeSaveMessage', message);
			const messageObject: Partial<IEditedMessage> = {
				editedAt: message.editedAt,
				editedBy: message.editedBy,
				msg: message.msg,
			};

			if (originalMessage.attachments) {
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
