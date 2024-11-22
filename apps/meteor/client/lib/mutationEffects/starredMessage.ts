import type { IMessage } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { Messages } from '../../../app/models/client';
import { t } from '../../../app/utils/lib/i18n';
import { dispatchToastMessage } from '../toast';

export const toggleStarredMessage = (message: IMessage, starred: boolean) => {
	const uid = Meteor.userId()!;

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
