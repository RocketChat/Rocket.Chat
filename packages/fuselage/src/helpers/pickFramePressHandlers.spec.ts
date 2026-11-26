import { pickFramePressHandlers as pickWeb } from './pickFramePressHandlers';
import { pickFramePressHandlers as pickNative } from './pickFramePressHandlers.native';

describe('on the web', () => {
	it('adds nothing to the frame, whatever the props carry', () => {
		expect(pickWeb({})).toEqual({});
		expect(
			pickWeb({ onPress: jest.fn(), onClick: jest.fn(), onLongPress: jest.fn(), onPointerDown: jest.fn(), onPointerUp: jest.fn() }),
		).toEqual({});
	});
});

describe('on React Native', () => {
	it('adds no handler to a part nobody listens to', () => {
		expect(pickNative({})).toEqual({});
	});

	it.each([
		['onPress', 'onPress'],
		['onClick', 'onPress'],
		['onPointerDown', 'onPressIn'],
		['onPointerUp', 'onPressOut'],
		['onLongPress', 'onLongPress'],
	] as const)('maps %s to %s and nothing else', (from, to) => {
		const handler = jest.fn();
		const picked = pickNative({ [from]: handler });

		expect(Object.keys(picked)).toEqual([to]);
		picked[to]?.();
		expect(handler).toHaveBeenCalledTimes(1);
		expect(handler).toHaveBeenCalledWith();
	});

	it('fires the deprecated onClick before onPress', () => {
		const calls: string[] = [];
		const picked = pickNative({ onClick: () => calls.push('onClick'), onPress: () => calls.push('onPress') });

		picked.onPress?.();

		expect(calls).toEqual(['onClick', 'onPress']);
	});
});
