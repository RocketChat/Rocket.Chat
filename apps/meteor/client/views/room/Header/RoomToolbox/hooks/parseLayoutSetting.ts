import type { RoomType } from '@rocket.chat/core-typings';

import type { RoomToolboxLayoutConfig } from './processRoomActions';

export const ROOM_TOOLBOX_LAYOUT_ROOM_TYPES = ['c', 'p', 'd'] as const;

export type RoomToolboxLayoutRoomType = (typeof ROOM_TOOLBOX_LAYOUT_ROOM_TYPES)[number];

export type RoomToolboxLayoutScope = RoomToolboxLayoutConfig & {
	roomType: RoomToolboxLayoutRoomType[];
};

export type RoomToolboxLayoutSetting = RoomToolboxLayoutScope[];

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const isLayoutItem = (value: unknown): boolean =>
	isRecord(value) &&
	typeof value.id === 'string' &&
	(value.featured === undefined || typeof value.featured === 'boolean') &&
	(value.order === undefined || Number.isFinite(value.order));

const isRoomTypeList = (value: unknown): boolean =>
	Array.isArray(value) && value.length > 0 && value.every((type) => (ROOM_TOOLBOX_LAYOUT_ROOM_TYPES as readonly unknown[]).includes(type));

// a missing roomType stays tolerated so an entry written before the setting was scoped is skipped
// rather than discarding the whole configuration
const isLayoutScope = (value: unknown): boolean =>
	isRecord(value) &&
	(value.roomType === undefined || isRoomTypeList(value.roomType)) &&
	(value.maxVisibleNormal === undefined || Number.isFinite(value.maxVisibleNormal)) &&
	(value.items === undefined || (Array.isArray(value.items) && value.items.every(isLayoutItem)));

const hasOverlappingRoomTypes = (scopes: RoomToolboxLayoutSetting): boolean => {
	const claimed = new Set<RoomToolboxLayoutRoomType>();

	for (const { roomType: roomTypes } of scopes) {
		for (const claimedType of roomTypes ?? []) {
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

	if (!Array.isArray(parsed) || !parsed.every(isLayoutScope)) {
		return null;
	}

	return parsed as RoomToolboxLayoutSetting;
};

export const resolveLayoutForRoomType = (raw: string, roomType: RoomType): RoomToolboxLayoutConfig | null => {
	const scopes = parseLayoutSetting(raw);
	if (!scopes || hasOverlappingRoomTypes(scopes)) {
		return null;
	}

	const scope = scopes.find(({ roomType: roomTypes }) => roomTypes?.includes(roomType as RoomToolboxLayoutRoomType));
	if (!scope) {
		return null;
	}

	return { maxVisibleNormal: scope.maxVisibleNormal, items: scope.items };
};
