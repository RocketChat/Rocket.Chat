import { resolveLayoutForRoomType } from './parseLayoutSetting';

const setting = (value: unknown) => JSON.stringify(value);

describe('resolveLayoutForRoomType', () => {
	it.each([
		['an empty string', ''],
		['invalid JSON', '{ invalid json }'],
		['a bare entry object', setting({ roomType: ['c'] })],
		['the legacy layouts wrapper', setting({ layouts: [{ roomType: ['c'] }] })],
		['a JSON primitive', '42'],
		['null', 'null'],
	])('should return null when the setting is %s', (_, raw) => {
		expect(resolveLayoutForRoomType(raw, 'c')).toBeNull();
	});

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

	it('should return null when an entry declares no roomType, as the schema requires one', () => {
		expect(resolveLayoutForRoomType(setting([{ maxVisibleNormal: 2 }, { roomType: ['c'], maxVisibleNormal: 4 }]), 'c')).toBeNull();
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
			['a roomType is empty', setting([{ roomType: [] }])],
			['a roomType mixes a supported and an unsupported type', setting([{ roomType: ['c', 'l'], maxVisibleNormal: 4 }])],
			['a roomType holds only an unsupported type', setting([{ roomType: ['l'] }, { roomType: ['c'] }])],
			['a roomType holds an uppercase type', setting([{ roomType: ['C', 'c'] }])],
			['a roomType holds a non-string', setting([{ roomType: [1, 'c'] }])],
			['an entry is null', setting([{ roomType: ['c'] }, null])],
			['the matching entry itself is null', setting([null, { roomType: ['d'] }])],
			['an entry is a primitive', setting([{ roomType: ['c'] }, 'nope'])],
			['an entry is an array', setting([{ roomType: ['c'] }, []])],
			['an item featured is not a boolean', setting([{ roomType: ['c'], items: [{ id: 'thread', featured: 'yes' }] }])],
			['an item order is not a number', setting([{ roomType: ['c'], items: [{ id: 'thread', order: 'first' }] }])],
			['an item order is an object', setting([{ roomType: ['c'], items: [{ id: 'thread', order: {} }] }])],
			['an item order is null', setting([{ roomType: ['c'], items: [{ id: 'thread', order: null }] }])],
			['an item order parses to Infinity', '[{"roomType":["c"],"items":[{"id":"thread","order":1e999}]}]'],
			['the setting is an empty list', setting([])],
			['an entry carries an unknown key', setting([{ roomType: ['c'], somethingElse: true }])],
			['an item carries an unknown key', setting([{ roomType: ['c'], items: [{ id: 'thread', pinned: true }] }])],
			['an item id is empty', setting([{ roomType: ['c'], items: [{ id: '' }] }])],
			['an item order is fractional', setting([{ roomType: ['c'], items: [{ id: 'thread', order: 1.5 }] }])],
			['maxVisibleNormal is negative', setting([{ roomType: ['c'], maxVisibleNormal: -1 }])],
			['maxVisibleNormal is fractional', setting([{ roomType: ['c'], maxVisibleNormal: 1.5 }])],
		])('should return null so the toolbox keeps its default layout when %s', (_, raw) => {
			expect(resolveLayoutForRoomType(raw, 'c')).toBeNull();
		});

		it('should discard the whole setting when a later entry overlaps, even if the matching one is fine', () => {
			const raw = setting([{ roomType: ['c'], maxVisibleNormal: 4 }, { roomType: ['d'] }, { roomType: ['d'] }]);

			expect(resolveLayoutForRoomType(raw, 'c')).toBeNull();
		});
	});
});
