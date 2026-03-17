import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import {
	usePermission,
	useUserRoom,
	useUserSubscription,
	useToastMessageDispatch,
	useUserId,
	useUser,
} from '@rocket.chat/ui-contexts';
import { useMemo, useState, useEffect } from 'react';

import { getRoomDirectives } from '../../../lib/getRoomDirectives';
import { useUserHasRoomRole } from '../../useUserHasRoomRole';
import type { UserInfoAction, UserInfoActionType } from '../useUserInfoActions';

// Глобальное хранилище для демо-режима
const demoStore: {
	roles: Record<string, boolean>;
	listeners: Set<() => void>;
} = {
	roles: {},
	listeners: new Set(),
};

const subscribe = (listener: () => void) => {
	demoStore.listeners.add(listener);
	return () => {
		demoStore.listeners.delete(listener);
	};
};

const updateDemoRole = (key: string, value: boolean) => {
	demoStore.roles[key] = value;
	demoStore.listeners.forEach((listener) => listener());
};

const useDemoRole = (key: string, serverValue: boolean) => {
	const [value, setValue] = useState(() => {
		return demoStore.roles[key] !== undefined ? demoStore.roles[key] : serverValue;
	});

	useEffect(() => {
		const unsubscribe = subscribe(() => {
			setValue(demoStore.roles[key] !== undefined ? demoStore.roles[key] : serverValue);
		});

		if (demoStore.roles[key] === undefined) {
			setValue(serverValue);
		}

		return unsubscribe;
	}, [key, serverValue]);

	return [value, (newValue: boolean) => updateDemoRole(key, newValue)] as const;
};

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

	if (!room) {
		throw Error('Room not provided');
	}

	const { roomCanSetImportantMessageMarker } = getRoomDirectives({ room, showingUserId: uid, userSubscription });
	
	const isCurrentUserPrivileged = currentUserRoles.some((role: string) => 
		['admin', 'owner'].includes(role)
	);
	
	const isTargetOwner = useUserHasRoomRole(uid, rid, 'owner');
	const isTargetModerator = useUserHasRoomRole(uid, rid, 'moderator');
	
	// УБРАЛИ leader из проверки
	const isTargetPrivileged = isTargetOwner || isTargetModerator;

	const demoKey = `${uid}-${rid}-important-message-marker`;
	const serverHasRole = useUserHasRoomRole(uid, rid, 'important-message-marker');
	
	const [hasRole, setHasRole] = useDemoRole(demoKey, serverHasRole);

	const changeRoleAction = useEffectEvent(async () => {
		try {
			const newRoleState = !hasRole;
			setHasRole(newRoleState);
			
			dispatchToastMessage({ 
				type: 'success', 
				message: newRoleState 
					? `Granted ability to mark important messages to @${username} (demo mode)`
					: `Removed ability to mark important messages from @${username} (demo mode)`
			});
		} catch (error) {
			dispatchToastMessage({ 
				type: 'error', 
				message: 'Failed to change role' 
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
