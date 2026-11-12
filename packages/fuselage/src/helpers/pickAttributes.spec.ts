import { pickWebCaptureHandlers, pickWebDropHandlers, pickWebPressHandlers } from './pickAttributes';

describe('pickAttributes', () => {
	it('passes through only the keys of the group', () => {
		const onClick = jest.fn();
		const onDrop = jest.fn();

		expect(pickWebPressHandlers({ onClick, onDrop, 'className': 'x', 'aria-label': 'y' })).toEqual({ onClick });
		expect(pickWebDropHandlers({ onClick, onDrop, className: 'x' })).toEqual({ onDrop });
	});

	it('drops undefined values', () => {
		const onKeyDownCapture = jest.fn();

		const picked = pickWebCaptureHandlers({ onClick: undefined, onKeyDownCapture, onFocusCapture: undefined });

		expect(picked).toEqual({ onKeyDownCapture });
		expect(Object.keys(picked)).toEqual(['onKeyDownCapture']);
	});

	it('returns an empty object when nothing matches', () => {
		expect(pickWebPressHandlers({})).toEqual({});
	});
});
