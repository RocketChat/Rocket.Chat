import type { RoomType } from '@rocket.chat/core-typings';
import { isRecord } from '@rocket.chat/tools';

import type { RoomToolboxLayoutConfig } from './processRoomActions';

const ROOM_TOOLBOX_LAYOUT_ROOM_TYPES = ['c', 'p', 'd'] as const;

type RoomToolboxLayoutRoomType = (typeof ROOM_TOOLBOX_LAYOUT_ROOM_TYPES)[number];

type RoomToolboxLayoutScope = RoomToolboxLayoutConfig & {
	roomType: RoomToolboxLayoutRoomType[];
};

export type RoomToolboxLayoutSetting = RoomToolboxLayoutScope[];

const SUPPORTED_ROOM_TYPES: ReadonlySet<unknown> = new Set(ROOM_TOOLBOX_LAYOUT_ROOM_TYPES);

const ENTRY_KEYS = ['roomType', 'maxVisibleNormal', 'items'];

const ITEM_KEYS = ['id', 'featured', 'order'];

// mirrors apps/meteor/lib/roomToolboxLayout/room-toolbox-layout.schema.json, which rejects the same
// values when the setting is saved; both have to change together
const hasOnlyKeys = (value: Record<string, unknown>, allowed: string[]): boolean =>
	Object.keys(value).every((key) => allowed.includes(key));

const isCount = (value: unknown): boolean => Number.isInteger(value) && (value as number) >= 0;

const isLayoutItem = (value: unknown): boolean =>
	isRecord(value) &&
	hasOnlyKeys(value, ITEM_KEYS) &&
	typeof value.id === 'string' &&
	value.id.length > 0 &&
	(value.featured === undefined || typeof value.featured === 'boolean') &&
	(value.order === undefined || Number.isInteger(value.order));

const isRoomTypeList = (value: unknown): boolean =>
	Array.isArray(value) && value.length > 0 && new Set(value).size === value.length && value.every((type) => SUPPORTED_ROOM_TYPES.has(type));

const isLayoutScope = (value: unknown): boolean =>
	isRecord(value) &&
	hasOnlyKeys(value, ENTRY_KEYS) &&
	isRoomTypeList(value.roomType) &&
	(value.maxVisibleNormal === undefined || isCount(value.maxVisibleNormal)) &&
	(value.items === undefined || (Array.isArray(value.items) && value.items.every(isLayoutItem)));

const hasOverlappingRoomTypes = (scopes: RoomToolboxLayoutSetting): boolean => {
	const claimed = new Set<RoomToolboxLayoutRoomType>();

	for (const { roomType: roomTypes } of scopes) {
		for (const claimedType of roomTypes) {
			if (claimed.has(claimedType)) {
				return true;
			}
			claimed.add(claimedType);
		}
	}

	return false;
};

const parseLayoutSetting = (raw: string): RoomToolboxLayoutSetting | null => {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return null;
	}

	if (!Array.isArray(parsed) || parsed.length === 0 || !parsed.every(isLayoutScope)) {
		return null;
	}

	return parsed as RoomToolboxLayoutSetting;
};

export const resolveLayoutForRoomType = (raw: string, roomType: RoomType): RoomToolboxLayoutConfig | null => {
	const scopes = parseLayoutSetting(raw);
	if (!scopes || hasOverlappingRoomTypes(scopes)) {
		return null;
	}

	const scope = scopes.find(({ roomType: roomTypes }) => roomTypes.includes(roomType as RoomToolboxLayoutRoomType));
	if (!scope) {
		return null;
	}

	return { maxVisibleNormal: scope.maxVisibleNormal, items: scope.items };
};
