import type { IMessage } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { Messages } from '../../../app/models/client';

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
};
