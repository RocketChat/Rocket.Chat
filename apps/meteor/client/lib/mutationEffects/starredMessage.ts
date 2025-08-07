import type { IMessage } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { Messages } from '../../stores';

export const toggleStarredMessage = (message: IMessage, starred: boolean) => {
	const uid = Meteor.userId()!;

	if (starred) {
		Messages.state.update(
			(record) => record._id === message._id,
			(record) => ({
				...record,
				starred: [...(record.starred ?? []), { _id: uid }],
			}),
		);
		return;
	}

	Messages.state.update(
		(record) => record._id === message._id,
		(record) => ({
			...record,
			starred: (record.starred ?? []).filter((star) => star._id !== uid),
		}),
	);
};
