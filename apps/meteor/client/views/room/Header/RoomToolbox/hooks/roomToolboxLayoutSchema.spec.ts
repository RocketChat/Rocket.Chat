import { ajv } from '@rocket.chat/rest-typings';

import { resolveLayoutForRoomType } from './parseLayoutSetting';
import type { RoomToolboxLayoutSetting } from './parseLayoutSetting';
import schema from '../../../../../../lib/roomToolboxLayout/room-toolbox-layout.schema.json';

const validate = ajv.compile(schema);

const validSetting: RoomToolboxLayoutSetting = [
	{ roomType: ['c', 'p'], maxVisibleNormal: 3, items: [{ id: 'members-list', featured: true, order: 1 }] },
	{ roomType: ['d'], maxVisibleNormal: 1 },
];

describe('room toolbox layout JSON schema', () => {
	it('accepts a document typed as RoomToolboxLayoutSetting', () => {
		expect(validate(validSetting)).toBe(true);
	});

	it.each([
		['an entry with only roomType', [{ roomType: ['c'] }]],
		['an entry with an empty items list', [{ roomType: ['c'], items: [] }]],
		['an item with only an id', [{ roomType: ['c'], items: [{ id: 'thread' }] }]],
		['maxVisibleNormal of zero', [{ roomType: ['c'], maxVisibleNormal: 0 }]],
		['a negative order', [{ roomType: ['c'], items: [{ id: 'thread', order: -1 }] }]],
		['entries that partition the room types', [{ roomType: ['c', 'p'] }, { roomType: ['d'] }]],
	])('accepts %s', (_name, setting) => {
		expect(validate(setting)).toBe(true);
	});

	it.each([
		['a bare entry object', { roomType: ['c'] }],
		['the legacy layouts wrapper', { layouts: [{ roomType: ['c'] }] }],
		['a JSON primitive', 42],
		['null', null],
		['an empty list', []],
		['a null entry', [null]],
		['an entry that is an array', [[]]],
		['an unknown entry key', [{ roomType: ['c'], somethingElse: true }]],
	])('rejects %s', (_name, setting) => {
		expect(validate(setting)).toBe(false);
	});

	describe('roomType', () => {
		it.each([
			['roomType is missing', [{ items: [] }]],
			['roomType is an empty list', [{ roomType: [] }]],
			['roomType is a bare string', [{ roomType: 'c' }]],
			['roomType holds the omnichannel type', [{ roomType: ['l'] }]],
			['roomType holds an unknown type', [{ roomType: ['x'] }]],
			['roomType mixes a valid and an invalid type', [{ roomType: ['c', 'l'] }]],
			['roomType holds a non-string', [{ roomType: [1] }]],
			['roomType holds an uppercase type', [{ roomType: ['C'] }]],
			['the same room type is repeated inside one entry', [{ roomType: ['c', 'c'] }]],
			['the same room type is claimed by two entries', [{ roomType: ['c', 'p'] }, { roomType: ['c'] }]],
			['every room type is claimed twice', [{ roomType: ['c', 'p', 'd'] }, { roomType: ['c', 'p', 'd'] }]],
		])('rejects when %s', (_name, setting) => {
			expect(validate(setting)).toBe(false);
		});
	});

	describe('items and maxVisibleNormal', () => {
		it.each([
			['items is not an array', [{ roomType: ['c'], items: {} }]],
			['an item is null', [{ roomType: ['c'], items: [null] }]],
			['an item has no id', [{ roomType: ['c'], items: [{ order: 1 }] }]],
			['an item id is empty', [{ roomType: ['c'], items: [{ id: '' }] }]],
			['an item id is not a string', [{ roomType: ['c'], items: [{ id: {} }] }]],
			['an item featured is not a boolean', [{ roomType: ['c'], items: [{ id: 'thread', featured: 'yes' }] }]],
			['an item order is fractional', [{ roomType: ['c'], items: [{ id: 'thread', order: 1.5 }] }]],
			['an item has an unknown key', [{ roomType: ['c'], items: [{ id: 'thread', pinned: true }] }]],
			['maxVisibleNormal is negative', [{ roomType: ['c'], maxVisibleNormal: -1 }]],
			['maxVisibleNormal is fractional', [{ roomType: ['c'], maxVisibleNormal: 1.5 }]],
			[
				'a later entry is invalid even if the first one is fine',
				[
					{ roomType: ['c'], items: [{ id: 'thread' }] },
					{ roomType: ['d'], items: [null] },
				],
			],
		])('rejects when %s', (_name, setting) => {
			expect(validate(setting)).toBe(false);
		});
	});
});

describe('client validation parity with the JSON schema', () => {
	const documents: [string, unknown][] = [
		['a complete document', validSetting],
		['an entry with only roomType', [{ roomType: ['c'] }]],
		['maxVisibleNormal of zero', [{ roomType: ['c'], maxVisibleNormal: 0 }]],
		['an item with only an id', [{ roomType: ['c'], items: [{ id: 'thread' }] }]],
		['an empty list', []],
		['an entry with no roomType', [{ roomType: ['c'] }, { maxVisibleNormal: 1 }]],
		['an unsupported room type', [{ roomType: ['c', 'l'] }]],
		['a duplicated room type', [{ roomType: ['c', 'c'] }]],
		['overlapping entries', [{ roomType: ['c', 'p'] }, { roomType: ['c'] }]],
		['an unknown entry key', [{ roomType: ['c'], somethingElse: true }]],
		['an unknown item key', [{ roomType: ['c'], items: [{ id: 'thread', pinned: true }] }]],
		['an empty item id', [{ roomType: ['c'], items: [{ id: '' }] }]],
		['a fractional order', [{ roomType: ['c'], items: [{ id: 'thread', order: 1.5 }] }]],
		['a non-boolean featured', [{ roomType: ['c'], items: [{ id: 'thread', featured: 'yes' }] }]],
		['a negative maxVisibleNormal', [{ roomType: ['c'], maxVisibleNormal: -1 }]],
		['a fractional maxVisibleNormal', [{ roomType: ['c'], maxVisibleNormal: 1.5 }]],
		['a null entry', [{ roomType: ['c'] }, null]],
	];

	it.each(documents)('agrees on %s', (_name, document) => {
		const raw = JSON.stringify(document);
		// ajv coerces in place, so it gets its own copy
		const acceptedBySchema = validate(JSON.parse(raw));
		const claimsPublicChannel = (document as { roomType?: string[] }[]).some((entry) => entry?.roomType?.includes('c'));

		expect(resolveLayoutForRoomType(raw, 'c') !== null).toBe(acceptedBySchema && claimsPublicChannel);
	});
});
