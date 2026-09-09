import { parseLayoutSetting, resolveLayoutForRoomType } from './parseLayoutSetting';

const setting = (value: unknown) => JSON.stringify(value);

describe('parseLayoutSetting', () => {
	it('should return the entries as they were saved', () => {
		const raw = setting([{ roomType: ['c', 'p'], maxVisibleNormal: 4, items: [{ id: 'thread', featured: true, order: 1 }] }]);

		expect(parseLayoutSetting(raw)).toEqual([
			{ roomType: ['c', 'p'], maxVisibleNormal: 4, items: [{ id: 'thread', featured: true, order: 1 }] },
		]);
	});

	it.each([
		['an empty string', ''],
		['invalid JSON', '{ invalid json }'],
		['a bare entry object', setting({ roomType: ['c'] })],
		['the legacy layouts wrapper', setting({ layouts: [{ roomType: ['c'] }] })],
		['a JSON primitive', '42'],
		['null', 'null'],
	])('should return null when the setting is %s', (_, raw) => {
		expect(parseLayoutSetting(raw)).toBeNull();
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
	] as const)('should resolve the entry declaring room type %s', (roomType, maxVisibleNormal) => {
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

	it('should return null for a room type no entry declares', () => {
		expect(resolveLayoutForRoomType(setting([{ roomType: ['c'] }]), 'd')).toBeNull();
	});

	it('should return null for the omnichannel room type', () => {
		expect(resolveLayoutForRoomType(raw, 'l')).toBeNull();
	});

	it('should return null when the setting itself is not parseable', () => {
		expect(resolveLayoutForRoomType('{ invalid json }', 'c')).toBeNull();
	});

	it('should return null when there are no entries', () => {
		expect(resolveLayoutForRoomType(setting([]), 'c')).toBeNull();
	});

	it('should skip entries left without a roomType by an older configuration', () => {
		expect(resolveLayoutForRoomType(setting([{ maxVisibleNormal: 2 }, { roomType: ['c'], maxVisibleNormal: 4 }]), 'c')).toEqual({
			maxVisibleNormal: 4,
			items: undefined,
		});
	});

	describe('when the value did not go through schema validation', () => {
		it.each([
			['items is not an array', setting([{ roomType: ['c'], items: {} }])],
			['items holds a null', setting([{ roomType: ['c'], items: [null] }])],
			['items holds a primitive', setting([{ roomType: ['c'], items: ['thread'] }])],
			['an item has no id', setting([{ roomType: ['c'], items: [{ order: 1 }] }])],
			['an item id is not a string', setting([{ roomType: ['c'], items: [{ id: 1 }] }])],
			['maxVisibleNormal is a string', setting([{ roomType: ['c'], maxVisibleNormal: '4' }])],
			['maxVisibleNormal is null', setting([{ roomType: ['c'], maxVisibleNormal: null }])],
			['the same room type is claimed by two entries', setting([{ roomType: ['c', 'p'] }, { roomType: ['c'] }])],
			['the same room type is repeated inside one entry', setting([{ roomType: ['c', 'c'] }])],
			['a roomType is not an array', setting([{ roomType: 'c' }])],
			['an entry is null', setting([{ roomType: ['c'] }, null])],
			['the matching entry itself is null', setting([null, { roomType: ['d'] }])],
			['an entry is a primitive', setting([{ roomType: ['c'] }, 'nope'])],
			['an entry is an array', setting([{ roomType: ['c'] }, []])],
			['an item featured is not a boolean', setting([{ roomType: ['c'], items: [{ id: 'thread', featured: 'yes' }] }])],
			['an item order is not a number', setting([{ roomType: ['c'], items: [{ id: 'thread', order: 'first' }] }])],
			['an item order is an object', setting([{ roomType: ['c'], items: [{ id: 'thread', order: {} }] }])],
			['an item order is null', setting([{ roomType: ['c'], items: [{ id: 'thread', order: null }] }])],
			['an item order parses to Infinity', '[{"roomType":["c"],"items":[{"id":"thread","order":1e999}]}]'],
		])('should return null so the toolbox keeps its default layout when %s', (_, raw) => {
			expect(resolveLayoutForRoomType(raw, 'c')).toBeNull();
		});

		it('should discard the whole setting when a later entry overlaps, even if the matching one is fine', () => {
			const raw = setting([{ roomType: ['c'], maxVisibleNormal: 4 }, { roomType: ['d'] }, { roomType: ['d'] }]);

			expect(resolveLayoutForRoomType(raw, 'c')).toBeNull();
		});
	});
});
