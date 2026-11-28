import type { IMessage } from '@rocket.chat/core-typings';
import type { Filter } from 'mongodb';

export const parsePinned = (pinned: string | boolean | undefined): Filter<IMessage> => {
	const lower = String(pinned).toLowerCase();
	if (lower === 'true') {
		return { pinned: true };
	}
	if (lower === 'false') {
		return { pinned: { $ne: true } };
	}
	return {};
};
