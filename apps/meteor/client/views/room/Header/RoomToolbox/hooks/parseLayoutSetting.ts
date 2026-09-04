import type { RoomType } from '@rocket.chat/core-typings';

import type { RoomToolboxLayoutConfig, RoomToolboxLayoutItem } from './processRoomActions';

export const ROOM_TOOLBOX_LAYOUT_ROOM_TYPES = ['c', 'p', 'd'] as const;

export type RoomToolboxLayoutRoomType = (typeof ROOM_TOOLBOX_LAYOUT_ROOM_TYPES)[number];

export type RoomToolboxLayoutScope = RoomToolboxLayoutConfig & {
	roomType: RoomToolboxLayoutRoomType[];
};

export type RoomToolboxLayoutSetting = {
	layouts: RoomToolboxLayoutScope[];
};

const isRoomToolboxLayoutRoomType = (value: unknown): value is RoomToolboxLayoutRoomType =>
	typeof value === 'string' && ROOM_TOOLBOX_LAYOUT_ROOM_TYPES.includes(value as RoomToolboxLayoutRoomType);

const isValidRoomTypeList = (value: unknown): value is RoomToolboxLayoutRoomType[] =>
	Array.isArray(value) && value.length > 0 && value.every(isRoomToolboxLayoutRoomType);

const isValidLayoutItem = (value: unknown): value is RoomToolboxLayoutItem => {
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	const candidate = value as Record<string, unknown>;
	return (
		typeof candidate.id === 'string' &&
		(candidate.featured === undefined || typeof candidate.featured === 'boolean') &&
		(candidate.order === undefined || (typeof candidate.order === 'number' && Number.isFinite(candidate.order)))
	);
};

const isValidLayoutScope = (value: unknown): value is RoomToolboxLayoutScope => {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return false;
	}
	const candidate = value as Record<string, unknown>;

	if (!isValidRoomTypeList(candidate.roomType)) {
		return false;
	}

	if (Array.isArray(candidate.items)) {
		if (!candidate.items.every(isValidLayoutItem)) {
			return false;
		}
	} else if (candidate.items !== undefined) {
		return false;
	}

	if (
		candidate.maxVisibleNormal !== undefined &&
		(typeof candidate.maxVisibleNormal !== 'number' || !Number.isFinite(candidate.maxVisibleNormal))
	) {
		return false;
	}

	return true;
};

const hasOverlappingRoomTypes = (layouts: RoomToolboxLayoutScope[]): boolean => {
	const claimed = new Set<RoomToolboxLayoutRoomType>();
	for (const scope of layouts) {
		for (const roomType of scope.roomType) {
			if (claimed.has(roomType)) {
				return true;
			}
			claimed.add(roomType);
		}
	}
	return false;
};

export const parseLayoutSetting = (raw: string): RoomToolboxLayoutSetting | null => {
	if (!raw) {
		return null;
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return null;
	}

	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
		return null;
	}

	const { layouts } = parsed as Record<string, unknown>;

	if (!Array.isArray(layouts) || !layouts.every(isValidLayoutScope)) {
		return null;
	}

	if (hasOverlappingRoomTypes(layouts)) {
		return null;
	}

	return { layouts };
};

export const resolveLayoutForRoomType = (raw: string, roomType: RoomType): RoomToolboxLayoutConfig | null => {
	const setting = parseLayoutSetting(raw);
	if (!setting) {
		return null;
	}

	const scope = setting.layouts.find((candidate) => candidate.roomType.includes(roomType as RoomToolboxLayoutRoomType));
	if (!scope) {
		return null;
	}

	return { maxVisibleNormal: scope.maxVisibleNormal, items: scope.items };
};
