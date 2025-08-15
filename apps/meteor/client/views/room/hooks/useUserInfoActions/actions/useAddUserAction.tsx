import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import {
	useTranslation,
	useUser,
	useUserRoom,
	useUserSubscription,
	useToastMessageDispatch,
	useAtLeastOnePermission,
	useEndpoint,
	usePermission,
} from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import * as Federation from '../../../../../lib/federation/Federation';
import { useAddMatrixUsers } from '../../../contextualBar/RoomMembers/AddUsers/AddMatrixUsers/useAddMatrixUsers';
import { getRoomDirectives } from '../../../lib/getRoomDirectives';
import type { UserInfoAction } from '../useUserInfoActions';

const inviteUserEndpoints = {
	c: '/v1/channels.invite',
	p: '/v1/groups.invite',
} as const;

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
	const hasManageRemotely = usePermission('manage-room-members-remotely');

	const { username, _id: uid } = user;

	// Can request both permissions regardless of room availability (uses room?.t)
	const hasPermissionToAddUsers = useAtLeastOnePermission(
		useMemo(() => [room?.t === 'p' ? 'add-user-to-any-p-room' : 'add-user-to-any-c-room', 'add-user-to-joined-room'], [room?.t]),
		rid,
	);

	// Check if user can add users based on room type and permissions
	const userCanAdd =
		hasManageRemotely ||
		(room &&
			!room.archived &&
			((isRoomFederated(room) && Federation.isEditableByTheUser(currentUser || undefined, room, subscription)) ||
				(!isRoomFederated(room) && hasPermissionToAddUsers)));

	const { roomCanInvite } = room
		? getRoomDirectives({ room, showingUserId: uid, userSubscription: subscription })
		: ({ roomCanInvite: false } as any);

	const inviteUser = useEndpoint('POST', inviteUserEndpoints[room?.t === 'p' ? 'p' : 'c']);

	const handleAddUser = useEffectEvent(async ({ users }: { users: string[] }) => {
		const [username] = users;
		await inviteUser({ roomId: rid, username });
		reload?.();
	});

	const addClickHandler = useAddMatrixUsers();

	const addUserOptionAction = useEffectEvent(async () => {
		try {
			const users = [username as string];
			if (room && isRoomFederated(room)) {
				addClickHandler.mutate({ users, handleSave: handleAddUser });
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
			(roomCanInvite || hasManageRemotely) && userCanAdd
				? {
						content: t('add-to-room'),
						icon: 'user-plus' as const,
						onClick: addUserOptionAction,
						type: 'management' as const,
					}
				: undefined,
		[roomCanInvite, userCanAdd, t, addUserOptionAction, hasManageRemotely],
	);

	return addUserOption;
};
