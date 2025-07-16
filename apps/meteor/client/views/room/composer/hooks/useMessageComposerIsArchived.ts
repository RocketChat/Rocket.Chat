import type { ISubscription } from '@rocket.chat/core-typings';
import { useCallback } from 'react';

import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';

export const useMessageComposerIsArchived = (rid: string, subscription?: ISubscription): boolean => {
	const isArchived = useReactiveValue(
		useCallback(
			() => roomCoordinator.archived(rid) || Boolean(subscription && subscription.t === 'd' && subscription.archived),
			[rid, subscription],
		),
	);

	return Boolean(isArchived);
};
