import type { RoomType } from '@rocket.chat/core-typings';

import type { RoomToolboxLayoutConfig } from './processRoomActions';

export const ROOM_TOOLBOX_LAYOUT_ROOM_TYPES = ['c', 'p', 'd'] as const;

export type RoomToolboxLayoutRoomType = (typeof ROOM_TOOLBOX_LAYOUT_ROOM_TYPES)[number];

export type RoomToolboxLayoutScope = RoomToolboxLayoutConfig & {
	roomType: RoomToolboxLayoutRoomType[];
};

export type RoomToolboxLayoutSetting = RoomToolboxLayoutScope[];

const isUsableScope = ({ maxVisibleNormal, items }: RoomToolboxLayoutScope): boolean => {
	if (maxVisibleNormal !== undefined && !Number.isFinite(maxVisibleNormal)) {
		return false;
	}

	if (items === undefined) {
		return true;
	}

	return Array.isArray(items) && items.every((item) => typeof item === 'object' && item !== null && typeof item.id === 'string');
};

const hasOverlappingRoomTypes = (scopes: RoomToolboxLayoutSetting): boolean => {
	const claimed = new Set<RoomToolboxLayoutRoomType>();

	for (const { roomType: roomTypes } of scopes) {
		for (const claimedType of Array.isArray(roomTypes) ? roomTypes : []) {
			if (claimed.has(claimedType)) {
				return true;
			}
			claimed.add(claimedType);
		}
	}

	return false;
};

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
	if (!scopes || hasOverlappingRoomTypes(scopes)) {
		return null;
	}

	const scope = scopes.find(
		({ roomType: roomTypes }) => Array.isArray(roomTypes) && roomTypes.includes(roomType as RoomToolboxLayoutRoomType),
	);
	if (!scope || !isUsableScope(scope)) {
		return null;
	}

	return { maxVisibleNormal: scope.maxVisibleNormal, items: scope.items };
};
