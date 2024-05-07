import type { IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { useCallback } from 'react';

import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';

export const useMessageComposerIsReadOnly = (rid: string): boolean => {
	const isReadOnly = useReactiveValue(
		useCallback(
			() => roomCoordinator.readOnly(rid, Meteor.users.findOne(Meteor.userId() as string, { fields: { username: 1 } }) as IUser),
			[rid],
		),
	);

	return Boolean(isReadOnly);
};
