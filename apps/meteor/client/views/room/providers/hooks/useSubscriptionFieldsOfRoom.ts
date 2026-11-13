import type { ISubscription } from '@rocket.chat/core-typings';
import { useRef } from 'react';

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

	// ponytail: compares by JSON, enough for a single subscription record per render
	const key = JSON.stringify(fields);
	const cache = useRef<{ key: string; fields: typeof fields }>({ key, fields });

	if (cache.current.key !== key) {
		cache.current = { key, fields };
	}

	return cache.current.fields;
};
