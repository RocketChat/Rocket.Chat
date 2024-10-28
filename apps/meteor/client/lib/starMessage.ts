import type { IMessage } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { dispatchToastMessage } from './toast';
import { Messages, Subscriptions } from '../../app/models/client';
import { settings } from '../../app/settings/client';
import { t } from '../../app/utils/lib/i18n';

export const starMessage = (message: IMessage, starred: boolean) => {
	const uid = Meteor.userId();

	if (!uid) {
		throw new Error(t('error-starring-message'));
	}

	if (!Subscriptions.findOne({ rid: message.rid })) {
		throw new Error(t('error-starring-message'));
	}

	if (!Messages.findOne({ _id: message._id, rid: message.rid })) {
		throw new Error(t('error-starring-message'));
	}

	if (!settings.get('Message_AllowStarring')) {
		throw new Error(t('error-starring-message'));
	}

	if (starred) {
		Messages.update(
			{ _id: message._id },
			{
				$addToSet: {
					starred: { _id: uid },
				},
			},
		);
		dispatchToastMessage({ type: 'success', message: t('Message_has_been_starred') });
		return;
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
};
