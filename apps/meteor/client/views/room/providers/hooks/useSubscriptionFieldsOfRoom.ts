import type { ISubscription } from '@rocket.chat/core-typings';
import { useState } from 'react';

import { omit } from '../../../../../lib/utils/omit';

/**
 * The subscription fields merged into the opened room, without the ones that change on every new message or read
 * mark, so that those changes keep the room's identity. The same object is returned while the remaining fields are
 * equal.
 */
export const useSubscriptionFieldsOfRoom = (subscription: ISubscription | undefined) => {
	const fields =
		subscription &&
		omit(
			subscription,
			'ls',
			'lr',
			'unread',
			'alert',
			'tunread',
			'tunreadUser',
			'tunreadGroup',
			'userMentions',
			'groupMentions',
			'_updatedAt',
		);

	const key = JSON.stringify(fields);
	const [cache, setCache] = useState({ key, fields });

	if (cache.key !== key) {
		setCache({ key, fields });
		return fields;
	}

	return cache.fields;
};
