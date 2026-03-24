import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import {
	usePermission,
	useUserRoom,
	useUserSubscription,
	useToastMessageDispatch,
	useUserId,
	useUser,
	useMethod,
	useStream,
} from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useEffect } from 'react';

import { getRoomDirectives } from '../../../lib/getRoomDirectives';
import type { UserInfoAction, UserInfoActionType } from '../useUserInfoActions';

export const useChangeImportantMessageMarkerAction = (
	user: Pick<IUser, '_id' | 'username' | 'name' | 'freeSwitchExtension' | 'roles'>,
	rid: IRoom['_id'],
): UserInfoAction | undefined => {
	const room = useUserRoom(rid);
	const { _id: uid, username } = user;
	const currentUserId = useUserId();
	const currentUser = useUser();
	
	const currentUserRoles = currentUser?.roles || [];
	
	const userSubscription = useUserSubscription(rid);
	
	const userCanSetImportantMessageMarker = usePermission('set-important-message-marker', rid);
	const dispatchToastMessage = useToastMessageDispatch();
	const getUserRoomRole = useMethod('getUserRoomRole');
	const queryClient = useQueryClient();
	const subscribeToNotifyLogged = useStream('notify-logged');

	if (!room) {
		throw Error('Room not provided');
	}

	const { roomCanSetImportantMessageMarker } = getRoomDirectives({ room, showingUserId: uid, userSubscription });
	
	const isCurrentUserPrivileged = currentUserRoles.some((role: string) => 
		['admin', 'owner'].includes(role)
	);
	
	useEffect(() => {
		const unsubscribe = subscribeToNotifyLogged('roles-change', (role) => {
			if (role.u?._id === uid && (role.scope === rid || !role.scope)) {
				queryClient.invalidateQueries({ 
					queryKey: ['user-room-role', uid, rid] 
				});
			}
		});
		
		return unsubscribe;
	}, [subscribeToNotifyLogged, uid, rid, queryClient]);
	
	const { data: isTargetOwner = false } = useQuery({
		queryKey: ['user-room-role', uid, rid, 'owner'],
		queryFn: async () => {
			try {
				return await getUserRoomRole(rid, uid, 'owner');
			} catch (error) {
				return false;
			}
		},
		staleTime: 0,
	});

	const isTargetPrivileged = isTargetOwner;

	const { data: hasRole = false, refetch } = useQuery({
		queryKey: ['user-room-role', uid, rid, 'important-message-marker'],
		queryFn: async () => {
			try {
				return await getUserRoomRole(rid, uid, 'important-message-marker');
			} catch (error) {
				return false;
			}
		},
		staleTime: 0,
	});

	const changeRoleAction = useEffectEvent(async () => {
		try {
			const newRoleState = !hasRole;

			await Meteor.callAsync(
				newRoleState
					? 'addRoomImportantMessageMarker'
					: 'removeRoomImportantMessageMarker',
				rid,
				uid
			);

			// Refetch the role status and invalidate all role queries for this user
			await refetch();
			await queryClient.invalidateQueries({ 
				queryKey: ['user-room-role', uid, rid] 
			});

			dispatchToastMessage({
				type: 'success',
				message: newRoleState
					? `Granted ability to mark important messages to @${username} in this room`
					: `Removed ability to mark important messages from @${username} in this room`,
			});
		} catch (error) {
			const message =
				error && typeof error === 'object' && 'message' in error
					? (error as any).message
					: String(error);

			dispatchToastMessage({
				type: 'error',
				message: `Failed to change role: ${message}`,
			});
		}
	});

	const changeRoleOption = useMemo(() => {
		if (uid === currentUserId) {
			return undefined;
		}

		if (!roomCanSetImportantMessageMarker) {
			return undefined;
		}

		if (!userCanSetImportantMessageMarker) {
			return undefined;
		}

		if (!isCurrentUserPrivileged) {
			return undefined;
		}

		if (isTargetPrivileged) {
			return undefined;
		}

		return {
			content: hasRole 
				? 'Remove ability to mark important messages'
				: 'Grant ability to mark important messages',
			icon: 'flag' as const,
			onClick: changeRoleAction,
			type: 'privileges' as UserInfoActionType,
		};
	}, [
		hasRole, 
		roomCanSetImportantMessageMarker, 
		userCanSetImportantMessageMarker,
		isCurrentUserPrivileged,
		isTargetPrivileged,
		changeRoleAction, 
		uid, 
		currentUserId
	]);

	return changeRoleOption;
};
