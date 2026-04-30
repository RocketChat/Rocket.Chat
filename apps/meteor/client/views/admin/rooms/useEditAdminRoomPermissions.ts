import type { IRoom, RoomAdminFieldsType } from '@rocket.chat/core-typings';
import { useMemo } from 'react';

import { RoomSettingsEnum } from '../../../../definition/IRoomTypeConfig';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { useIsABACManagedRoom } from '../ABAC/hooks/useIsABACManagedRoom';

export const useEditAdminRoomPermissions = (room: Pick<IRoom, RoomAdminFieldsType>) => {
	const isAbacManaged = useIsABACManagedRoom(room);

	const [
		canViewName,
		canViewTopic,
		canViewAnnouncementBase,
		canViewArchived,
		canViewDescription,
		canViewType,
		canViewReadOnly,
		canViewReactWhenReadOnly,
	] = useMemo(() => {
		const isAllowed = roomCoordinator.getRoomDirectives(room.t).allowRoomSettingChange;
		return [
			isAllowed?.(room, RoomSettingsEnum.NAME),
			isAllowed?.(room, RoomSettingsEnum.TOPIC),
			isAllowed?.(room, RoomSettingsEnum.ANNOUNCEMENT),
			isAllowed?.(room, RoomSettingsEnum.ARCHIVE_OR_UNARCHIVE),
			isAllowed?.(room, RoomSettingsEnum.DESCRIPTION),
			isAllowed?.(room, RoomSettingsEnum.TYPE),
			isAllowed?.(room, RoomSettingsEnum.READ_ONLY),
			isAllowed?.(room, RoomSettingsEnum.REACT_WHEN_READ_ONLY),
		];
	}, [room]);

	return {
		canViewName,
		canViewTopic,
		canViewAnnouncement: canViewAnnouncementBase && !isAbacManaged,
		canViewArchived,
		canViewDescription,
		canViewType,
		canViewReadOnly,
		canViewReactWhenReadOnly,
	};
};
