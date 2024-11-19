import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { Messages, Subscriptions } from '../../app/models/client';
import { settings } from '../../app/settings/client';
import { t } from '../../app/utils/lib/i18n';
import { dispatchToastMessage } from '../lib/toast';

Meteor.methods<ServerMethods>({
	starMessage(message) {
		const uid = Meteor.userId();

		if (!uid) {
			dispatchToastMessage({ type: 'error', message: t('error-starring-message') });
			return false;
		}

		if (!Subscriptions.findOne({ rid: message.rid })) {
			dispatchToastMessage({ type: 'error', message: t('error-starring-message') });
			return false;
		}

		if (!Messages.findOne({ _id: message._id, rid: message.rid })) {
			dispatchToastMessage({ type: 'error', message: t('error-starring-message') });
			return false;
		}

		if (!settings.get('Message_AllowStarring')) {
			dispatchToastMessage({ type: 'error', message: t('error-starring-message') });
			return false;
		}

		if (message.starred) {
			Messages.update(
				{ _id: message._id },
				{
					$addToSet: {
						starred: { _id: uid },
					},
				},
			);

			dispatchToastMessage({ type: 'success', message: t('Message_has_been_starred') });

			return true;
		}

		Messages.update(
			{ _id: message._id },
			{
				$pull: {
					starred: { _id: uid },
				},
			},
		);

		dispatchToastMessage({ type: 'success', message: t('Message_has_been_unstarred') });
		return true;
	},
});
