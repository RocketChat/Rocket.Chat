import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { useMethod, useStream } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useRoomRolesStore } from '../../../../hooks/useRoomRolesStore';

export const useRoomRolesManagement = (rid: IRoom['_id']): void => {
	const getRoomRoles = useMethod('getRoomRoles');

	useEffect(() => {
		getRoomRoles(rid).then((results) => {
			useRoomRolesStore.getState().sync(results);
		});
	}, [getRoomRoles, rid]);

	const subscribeToNotifyLoggedIn = useStream('notify-logged');

	useEffect(
		() =>
			subscribeToNotifyLoggedIn('roles-change', ({ type, ...role }) => {
				if (!role.scope || !role.u?._id) {
					return;
				}

				switch (type) {
					case 'added':
						useRoomRolesStore.getState().addRole({ rid: role.scope, uid: role.u._id }, role._id);
						break;

					case 'removed':
						useRoomRolesStore.getState().removeRole({ rid: role.scope, uid: role.u._id }, role._id);
						break;
				}
			}),
		[subscribeToNotifyLoggedIn],
	);

	useEffect(
		() =>
			subscribeToNotifyLoggedIn('Users:NameChanged', ({ _id: uid, username, name }: Partial<IUser>) => {
				if (!uid) {
					return;
				}
				useRoomRolesStore.getState().updateUser({ rid, uid }, { username, name });
			}),
		[rid, subscribeToNotifyLoggedIn],
	);
};
