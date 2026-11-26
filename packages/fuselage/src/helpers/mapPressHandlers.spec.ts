import { mapPressHandlers } from './mapPressHandlers';

describe('mapPressHandlers', () => {
	it('adds no handler to a part nobody listens to', () => {
		expect(mapPressHandlers({})).toEqual({});
	});

	it.each([
		['onPress', 'onPress'],
		['onClick', 'onPress'],
		['onPointerDown', 'onPressIn'],
		['onPointerUp', 'onPressOut'],
		['onLongPress', 'onLongPress'],
	] as const)('maps %s to %s and nothing else', (from, to) => {
		const handler = jest.fn();
		const mapped = mapPressHandlers({ [from]: handler });

		expect(Object.keys(mapped)).toEqual([to]);
		mapped[to]?.();
		expect(handler).toHaveBeenCalledTimes(1);
		expect(handler).toHaveBeenCalledWith();
	});

	it('fires the deprecated onClick before onPress', () => {
		const calls: string[] = [];
		const mapped = mapPressHandlers({ onClick: () => calls.push('onClick'), onPress: () => calls.push('onPress') });

		mapped.onPress?.();

		expect(calls).toEqual(['onClick', 'onPress']);
	});
});
