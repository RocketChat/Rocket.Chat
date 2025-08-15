import type { IMessage } from '@rocket.chat/core-typings';

import { accounts } from '../../meteor/facade/accounts';
import { Messages } from '../../stores';

export const toggleStarredMessage = (message: IMessage, starred: boolean) => {
	const uid = accounts.getUserId();

	if (!uid) return;

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
