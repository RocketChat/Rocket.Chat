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
});
