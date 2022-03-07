import { Meteor } from 'meteor/meteor';
import { TimeSync } from 'meteor/mizzao:timesync';
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

		const hasPermission = hasAtLeastOnePermission('edit-message', message.rid);
		const editAllowed = settings.get('Message_AllowEditing');
		let editOwn = false;
		if (originalMessage.msg === message.msg) {
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
			if (isNaN(TimeSync.serverOffset())) {
				message.editedAt = new Date();
			} else {
				message.editedAt = new Date(Date.now() + TimeSync.serverOffset());
			}

			message.editedBy = {
				_id: uid,
				username: me.username,
			};

			message = callbacks.run('beforeSaveMessage', message);
			const messageObject = {
				editedAt: message.editedAt,
				editedBy: message.editedBy,
				msg: message.msg,
			};

			if (originalMessage.attachments) {
				if (originalMessage.attachments[0].description !== undefined) {
					delete messageObject.msg;
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
