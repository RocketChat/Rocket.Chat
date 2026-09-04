import { parseLayoutSetting, resolveLayoutForRoomType } from './parseLayoutSetting';

const setting = (value: unknown) => JSON.stringify(value);

describe('parseLayoutSetting', () => {
	it('should accept a single scope covering several room types', () => {
		const raw = setting({
			layouts: [{ roomType: ['c', 'p'], maxVisibleNormal: 4, items: [{ id: 'thread', featured: true, order: 1 }] }],
		});

		expect(parseLayoutSetting(raw)).toEqual({
			layouts: [{ roomType: ['c', 'p'], maxVisibleNormal: 4, items: [{ id: 'thread', featured: true, order: 1 }] }],
		});
	});

	it('should accept a scope without items and without maxVisibleNormal', () => {
		const raw = setting({ layouts: [{ roomType: ['d'] }] });

		expect(parseLayoutSetting(raw)).toEqual({ layouts: [{ roomType: ['d'] }] });
	});

	it('should accept an empty layouts array', () => {
		expect(parseLayoutSetting(setting({ layouts: [] }))).toEqual({ layouts: [] });
	});

	it('should ignore unknown top level keys', () => {
		const raw = setting({ layouts: [{ roomType: ['c'] }], somethingElse: true });

		expect(parseLayoutSetting(raw)).toEqual({ layouts: [{ roomType: ['c'] }] });
	});

	it.each([
		['an empty string', ''],
		['invalid JSON', '{ invalid json }'],
		['a bare array', '[]'],
		['a bare array of scopes', setting([{ roomType: ['c'] }])],
		['a JSON primitive', '42'],
		['null', 'null'],
		['an object without layouts', setting({ items: [] })],
		['a non-array layouts', setting({ layouts: {} })],
		['a null scope', setting({ layouts: [null] })],
		['a scope that is an array', setting({ layouts: [[]] })],
	])('should return null when the setting is %s', (_, raw) => {
		expect(parseLayoutSetting(raw)).toBeNull();
	});

	describe('roomType validation', () => {
		it.each([
			['roomType is missing', setting({ layouts: [{ items: [] }] })],
			['roomType is an empty array', setting({ layouts: [{ roomType: [] }] })],
			['roomType is a bare string', setting({ layouts: [{ roomType: 'c' }] })],
			['roomType holds the omnichannel type', setting({ layouts: [{ roomType: ['l'] }] })],
			['roomType holds an unknown type', setting({ layouts: [{ roomType: ['x'] }] })],
			['roomType mixes a valid and an invalid type', setting({ layouts: [{ roomType: ['c', 'l'] }] })],
			['roomType holds a non-string', setting({ layouts: [{ roomType: [1] }] })],
			['roomType holds an uppercase type', setting({ layouts: [{ roomType: ['C'] }] })],
		])('should return null when %s', (_, raw) => {
			expect(parseLayoutSetting(raw)).toBeNull();
		});

		it('should return null when the same room type is claimed by two scopes', () => {
			const raw = setting({ layouts: [{ roomType: ['c', 'p'] }, { roomType: ['c'] }] });

			expect(parseLayoutSetting(raw)).toBeNull();
		});

		it('should return null when the same room type is repeated inside a single scope', () => {
			expect(parseLayoutSetting(setting({ layouts: [{ roomType: ['c', 'c'] }] }))).toBeNull();
		});

		it('should accept scopes that partition the room types without overlapping', () => {
			const raw = setting({ layouts: [{ roomType: ['c', 'p'] }, { roomType: ['d'] }] });

			expect(parseLayoutSetting(raw)).not.toBeNull();
		});
	});

	describe('items and maxVisibleNormal validation', () => {
		it.each([
			['items is not an array', setting({ layouts: [{ roomType: ['c'], items: {} }] })],
			['an item is null', setting({ layouts: [{ roomType: ['c'], items: [null] }] })],
			['an item has no id', setting({ layouts: [{ roomType: ['c'], items: [{ order: 1 }] }] })],
			['an item id is not a string', setting({ layouts: [{ roomType: ['c'], items: [{ id: 1 }] }] })],
			['an item featured is not a boolean', setting({ layouts: [{ roomType: ['c'], items: [{ id: 'thread', featured: 'yes' }] }] })],
			['an item order is not a number', setting({ layouts: [{ roomType: ['c'], items: [{ id: 'thread', order: '1' }] }] })],
			['maxVisibleNormal is not a number', setting({ layouts: [{ roomType: ['c'], maxVisibleNormal: '4' }] })],
		])('should return null when %s', (_, raw) => {
			expect(parseLayoutSetting(raw)).toBeNull();
		});

		it('should return null when a later scope is invalid even if the first one is fine', () => {
			const raw = setting({
				layouts: [
					{ roomType: ['c'], items: [{ id: 'thread' }] },
					{ roomType: ['d'], items: [null] },
				],
			});

			expect(parseLayoutSetting(raw)).toBeNull();
		});
	});
});

describe('resolveLayoutForRoomType', () => {
	const raw = setting({
		layouts: [
			{ roomType: ['c', 'p'], maxVisibleNormal: 4, items: [{ id: 'thread', featured: true, order: 1 }] },
			{ roomType: ['d'], maxVisibleNormal: 1, items: [{ id: 'discussions', order: 1 }] },
		],
	});

	it.each([
		['c', 4],
		['p', 4],
		['d', 1],
	] as const)('should resolve the scope declaring room type %s', (roomType, maxVisibleNormal) => {
		expect(resolveLayoutForRoomType(raw, roomType)).toEqual(
			expect.objectContaining({
				maxVisibleNormal,
			}),
		);
	});

	it('should strip roomType from the resolved engine config', () => {
		expect(resolveLayoutForRoomType(raw, 'c')).toEqual({
			maxVisibleNormal: 4,
			items: [{ id: 'thread', featured: true, order: 1 }],
		});
	});

	it('should return null for a room type no scope declares', () => {
		expect(resolveLayoutForRoomType(setting({ layouts: [{ roomType: ['c'] }] }), 'd')).toBeNull();
	});

	it('should return null for the omnichannel room type', () => {
		expect(resolveLayoutForRoomType(raw, 'l')).toBeNull();
	});

	it('should return null when the setting itself is invalid', () => {
		expect(resolveLayoutForRoomType('{ invalid json }', 'c')).toBeNull();
	});

	it('should return null when layouts is empty', () => {
		expect(resolveLayoutForRoomType(setting({ layouts: [] }), 'c')).toBeNull();
	});
});
