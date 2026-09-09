import type { RoomType } from '@rocket.chat/core-typings';

import type { RoomToolboxLayoutConfig } from './processRoomActions';

export const ROOM_TOOLBOX_LAYOUT_ROOM_TYPES = ['c', 'p', 'd'] as const;

export type RoomToolboxLayoutRoomType = (typeof ROOM_TOOLBOX_LAYOUT_ROOM_TYPES)[number];

export type RoomToolboxLayoutScope = RoomToolboxLayoutConfig & {
	roomType: RoomToolboxLayoutRoomType[];
};

export type RoomToolboxLayoutSetting = RoomToolboxLayoutScope[];

export const parseLayoutSetting = (raw: string): RoomToolboxLayoutSetting | null => {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return null;
	}

	return Array.isArray(parsed) ? (parsed as RoomToolboxLayoutSetting) : null;
};

export const resolveLayoutForRoomType = (raw: string, roomType: RoomType): RoomToolboxLayoutConfig | null => {
	const scopes = parseLayoutSetting(raw);

	const scope = scopes?.find(({ roomType: roomTypes }) => roomTypes?.includes(roomType as RoomToolboxLayoutRoomType));
	if (!scope) {
		return null;
	}

	return { maxVisibleNormal: scope.maxVisibleNormal, items: scope.items };
};
