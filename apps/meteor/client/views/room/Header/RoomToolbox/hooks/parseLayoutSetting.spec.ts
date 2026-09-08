import { parseLayoutSetting, resolveLayoutForRoomType } from './parseLayoutSetting';

const setting = (value: unknown) => JSON.stringify(value);

describe('parseLayoutSetting', () => {
	it('should accept a single scope covering several room types', () => {
		const raw = setting([{ roomType: ['c', 'p'], maxVisibleNormal: 4, items: [{ id: 'thread', featured: true, order: 1 }] }]);

		expect(parseLayoutSetting(raw)).toEqual([
			{ roomType: ['c', 'p'], maxVisibleNormal: 4, items: [{ id: 'thread', featured: true, order: 1 }] },
		]);
	});

	it('should accept a scope without items and without maxVisibleNormal', () => {
		const raw = setting([{ roomType: ['d'] }]);

		expect(parseLayoutSetting(raw)).toEqual([{ roomType: ['d'] }]);
	});

	it('should accept an empty array', () => {
		expect(parseLayoutSetting(setting([]))).toEqual([]);
	});

	it('should ignore unknown scope keys', () => {
		const raw = setting([{ roomType: ['c'], somethingElse: true }]);

		expect(parseLayoutSetting(raw)).toEqual([{ roomType: ['c'], somethingElse: true }]);
	});

	it.each([
		['an empty string', ''],
		['invalid JSON', '{ invalid json }'],
		['a bare scope object', setting({ roomType: ['c'] })],
		['the legacy layouts wrapper', setting({ layouts: [{ roomType: ['c'] }] })],
		['a JSON primitive', '42'],
		['null', 'null'],
		['a null scope', setting([null])],
		['a scope that is an array', setting([[]])],
	])('should return null when the setting is %s', (_, raw) => {
		expect(parseLayoutSetting(raw)).toBeNull();
	});

	describe('roomType validation', () => {
		it.each([
			['roomType is missing', setting([{ items: [] }])],
			['roomType is an empty array', setting([{ roomType: [] }])],
			['roomType is a bare string', setting([{ roomType: 'c' }])],
			['roomType holds the omnichannel type', setting([{ roomType: ['l'] }])],
			['roomType holds an unknown type', setting([{ roomType: ['x'] }])],
			['roomType mixes a valid and an invalid type', setting([{ roomType: ['c', 'l'] }])],
			['roomType holds a non-string', setting([{ roomType: [1] }])],
			['roomType holds an uppercase type', setting([{ roomType: ['C'] }])],
		])('should return null when %s', (_, raw) => {
			expect(parseLayoutSetting(raw)).toBeNull();
		});

		it('should return null when the same room type is claimed by two scopes', () => {
			const raw = setting([{ roomType: ['c', 'p'] }, { roomType: ['c'] }]);

			expect(parseLayoutSetting(raw)).toBeNull();
		});

		it('should return null when the same room type is repeated inside a single scope', () => {
			expect(parseLayoutSetting(setting([{ roomType: ['c', 'c'] }]))).toBeNull();
		});

		it('should accept scopes that partition the room types without overlapping', () => {
			const raw = setting([{ roomType: ['c', 'p'] }, { roomType: ['d'] }]);

			expect(parseLayoutSetting(raw)).not.toBeNull();
		});
	});

	describe('items and maxVisibleNormal validation', () => {
		it.each([
			['items is not an array', setting([{ roomType: ['c'], items: {} }])],
			['an item is null', setting([{ roomType: ['c'], items: [null] }])],
			['an item has no id', setting([{ roomType: ['c'], items: [{ order: 1 }] }])],
			['an item id is not a string', setting([{ roomType: ['c'], items: [{ id: 1 }] }])],
			['an item featured is not a boolean', setting([{ roomType: ['c'], items: [{ id: 'thread', featured: 'yes' }] }])],
			['an item order is not a number', setting([{ roomType: ['c'], items: [{ id: 'thread', order: '1' }] }])],
			['maxVisibleNormal is not a number', setting([{ roomType: ['c'], maxVisibleNormal: '4' }])],
		])('should return null when %s', (_, raw) => {
			expect(parseLayoutSetting(raw)).toBeNull();
		});

		it('should return null when a later scope is invalid even if the first one is fine', () => {
			const raw = setting([
				{ roomType: ['c'], items: [{ id: 'thread' }] },
				{ roomType: ['d'], items: [null] },
			]);

			expect(parseLayoutSetting(raw)).toBeNull();
		});
	});
});

describe('resolveLayoutForRoomType', () => {
	const raw = setting([
		{ roomType: ['c', 'p'], maxVisibleNormal: 4, items: [{ id: 'thread', featured: true, order: 1 }] },
		{ roomType: ['d'], maxVisibleNormal: 1, items: [{ id: 'discussions', order: 1 }] },
	]);

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
		expect(resolveLayoutForRoomType(setting([{ roomType: ['c'] }]), 'd')).toBeNull();
	});

	it('should return null for the omnichannel room type', () => {
		expect(resolveLayoutForRoomType(raw, 'l')).toBeNull();
	});

	it('should return null when the setting itself is invalid', () => {
		expect(resolveLayoutForRoomType('{ invalid json }', 'c')).toBeNull();
	});

	it('should return null when there are no scopes', () => {
		expect(resolveLayoutForRoomType(setting([]), 'c')).toBeNull();
	});
});
