import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import {
	useTranslation,
	useUser,
	useUserRoom,
	useUserSubscription,
	useMethod,
	useToastMessageDispatch,
	useAtLeastOnePermission,
} from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import * as Federation from '../../../../../lib/federation/Federation';
import { useAddMatrixUsers } from '../../../contextualBar/RoomMembers/AddUsers/AddMatrixUsers/useAddMatrixUsers';
import { getRoomDirectives } from '../../../lib/getRoomDirectives';
import type { UserInfoAction } from '../useUserInfoActions';

export const useAddUserAction = (
	user: Pick<IUser, '_id' | 'username'>,
	rid: IRoom['_id'],
	reload?: () => void,
): UserInfoAction | undefined => {
	const t = useTranslation();
	const room = useUserRoom(rid);
	const currentUser = useUser();
	const subscription = useUserSubscription(rid);
	const dispatchToastMessage = useToastMessageDispatch();

	const { username, _id: uid } = user;

	if (!room) {
		throw Error('Room not provided');
	}

	const hasPermissionToAddUsers = useAtLeastOnePermission(
		useMemo(() => [room?.t === 'p' ? 'add-user-to-any-p-room' : 'add-user-to-any-c-room', 'add-user-to-joined-room'], [room?.t]),
		rid,
	);

	const userCanAdd =
		room && user && isRoomFederated(room)
			? Federation.isEditableByTheUser(currentUser || undefined, room, subscription)
			: hasPermissionToAddUsers;

	const { roomCanInvite } = getRoomDirectives({ room, showingUserId: uid, userSubscription: subscription });

	const addUsersToRooms = useMethod('addUsersToRoom');

	const handleAddUser = useEffectEvent(async ({ users }) => {
		await addUsersToRooms({ rid, users });
		reload?.();
	});

	const addClickHandler = useAddMatrixUsers();

	const addUserOptionAction = useEffectEvent(async () => {
		try {
			const users = [username as string];
			if (isRoomFederated(room)) {
				addClickHandler.mutate({
					users,
					handleSave: handleAddUser,
				});
			} else {
				await handleAddUser({ users });
			}
			dispatchToastMessage({ type: 'success', message: t('User_added') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error as Error });
		}
	});

	const addUserOption = useMemo(
		() =>
			roomCanInvite && userCanAdd
				? {
						content: t('Add_User'),
						icon: 'user-plus' as const,
						onClick: addUserOptionAction,
						type: 'management' as const,
				  }
				: undefined,
		[roomCanInvite, userCanAdd, t, addUserOptionAction],
	);

	return addUserOption;
};
