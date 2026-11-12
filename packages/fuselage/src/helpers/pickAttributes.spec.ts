import {
	pickPositionStyle,
	pickVirtualizerStyle,
	pickSvgTitle,
	pickWebAnimationHandlers,
	pickWebCaptureHandlers,
	pickWebDropHandlers,
	pickWebPressHandlers,
	pickWebRowHandlers,
	pickWebTextInputHandlers,
} from './pickAttributes';

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

describe('pickWebAnimationHandlers', () => {
	it('passes through only onAnimationEnd', () => {
		const onAnimationEnd = jest.fn();

		expect(pickWebAnimationHandlers({ onAnimationEnd, onClick: jest.fn() })).toEqual({ onAnimationEnd });
		expect(pickWebAnimationHandlers({})).toEqual({});
	});
});

describe('pickPositionStyle', () => {
	it('keeps the keys usePosition returns and drops the rest', () => {
		expect(pickPositionStyle({ style: { position: 'fixed', top: 4, zIndex: 999999, color: 'red' } })).toEqual({
			style: { position: 'fixed', top: 4, zIndex: 999999 },
		});
	});

	it('returns nothing when there is no style, or none of its keys', () => {
		expect(pickPositionStyle({})).toEqual({});
		expect(pickPositionStyle({ style: { color: 'red' } })).toEqual({});
	});
});

describe('pickVirtualizerStyle', () => {
	it('keeps the offsets and the scroll anchoring a virtualizer sets and drops the rest', () => {
		expect(
			pickVirtualizerStyle({
				style: {
					boxSizing: 'border-box',
					marginTop: 0,
					paddingTop: 120,
					paddingBottom: 40,
					visibility: 'visible',
					overflowAnchor: 'none',
					color: 'red',
				},
			}),
		).toEqual({
			style: { boxSizing: 'border-box', marginTop: 0, paddingTop: 120, paddingBottom: 40, visibility: 'visible', overflowAnchor: 'none' },
		});
	});

	it('returns nothing when there is no style, or none of its keys', () => {
		expect(pickVirtualizerStyle({})).toEqual({});
		expect(pickVirtualizerStyle({ style: { color: 'red' } })).toEqual({});
	});
});

describe('pickSvgTitle', () => {
	it('carries the title only when there is one', () => {
		expect(pickSvgTitle({ title: 'Online' })).toEqual({ title: 'Online' });
		expect(pickSvgTitle({})).toEqual({});
	});
});

describe('pickWebRowHandlers', () => {
	it('adds the pointer move and the capture-phase click to the press handlers', () => {
		const onClick = jest.fn();
		const onPointerMove = jest.fn();
		const onClickCapture = jest.fn();

		expect(pickWebRowHandlers({ onClick, onPointerMove, onClickCapture, onChange: jest.fn(), className: 'x' })).toEqual({
			onClick,
			onPointerMove,
			onClickCapture,
		});
		expect(pickWebRowHandlers({})).toEqual({});
	});
});

describe('pickWebTextInputHandlers', () => {
	it('passes through the text control handlers and nothing else', () => {
		const onChange = jest.fn();
		const onInput = jest.fn();
		const onPaste = jest.fn();
		const onDrop = jest.fn();

		expect(pickWebTextInputHandlers({ onChange, onInput, onPaste, onDrop, onMouseDown: jest.fn(), value: 'x' })).toEqual({
			onChange,
			onInput,
			onPaste,
			onDrop,
		});
		expect(pickWebTextInputHandlers({ onChange: undefined })).toEqual({});
	});
});
