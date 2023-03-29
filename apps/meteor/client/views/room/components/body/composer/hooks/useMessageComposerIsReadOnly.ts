import type { ISubscription, IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { useCallback } from 'react';

import { useReactiveValue } from '../../../../../../hooks/useReactiveValue';
import { roomCoordinator } from '../../../../../../lib/rooms/roomCoordinator';

export const useMessageComposerIsReadOnly = (rid: string, subscription?: ISubscription): boolean => {
	const [isReadOnly, isArchived] = useReactiveValue(
		useCallback(
			() => [
				roomCoordinator.readOnly(rid, Meteor.users.findOne(Meteor.userId() as string, { fields: { username: 1 } }) as IUser),
				roomCoordinator.archived(rid) || Boolean(subscription && subscription.t === 'd' && subscription.archived),
			],
			[rid, subscription],
		),
	);

	return Boolean(isReadOnly || isArchived);
};
