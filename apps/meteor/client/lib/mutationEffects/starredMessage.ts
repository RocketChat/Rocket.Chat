import type { IMessage } from '@rocket.chat/core-typings';

import { Messages } from '../../stores';
import { getUserId } from '../user';

export const toggleStarredMessage = (message: IMessage, starred: boolean) => {
	const uid = getUserId()!;

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
