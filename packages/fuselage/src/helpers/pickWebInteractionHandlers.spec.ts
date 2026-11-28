import { pickWebInteractionHandlers } from './pickWebInteractionHandlers';

it('passes through only the interaction handlers a consumer passed', () => {
	const onMouseDown = jest.fn();
	const props = { onMouseDown, 'onFocus': undefined, 'onClick': jest.fn(), 'className': 'x', 'aria-label': 'y' };

	const picked = pickWebInteractionHandlers(props);

	expect(picked).toEqual({ onMouseDown });
	expect(Object.keys(picked)).toEqual(['onMouseDown']);
});

it('picks every interaction handler and leaves the press and the click out', () => {
	const handlers = {
		onContextMenu: jest.fn(),
		onDragStart: jest.fn(),
		onKeyDown: jest.fn(),
		onKeyUp: jest.fn(),
		onMouseDown: jest.fn(),
		onMouseEnter: jest.fn(),
		onMouseLeave: jest.fn(),
		onMouseUp: jest.fn(),
		onPointerDown: jest.fn(),
		onPointerEnter: jest.fn(),
		onPointerLeave: jest.fn(),
		onPointerUp: jest.fn(),
		onTouchCancel: jest.fn(),
		onTouchEnd: jest.fn(),
		onTouchMove: jest.fn(),
		onTouchStart: jest.fn(),
		onFocus: jest.fn(),
		onBlur: jest.fn(),
	};

	const props = { ...handlers, onClick: jest.fn(), onPress: jest.fn() };

	expect(pickWebInteractionHandlers(props)).toEqual(handlers);
});

it('returns an empty object for no props', () => {
	expect(pickWebInteractionHandlers({})).toEqual({});
});

it('does not pick a prop that only looks like a handler', () => {
	const onBlur = jest.fn();
	const props = { onBlur, onmousedown: jest.fn(), onMouseDownCapture: jest.fn(), mouseDown: jest.fn() };

	expect(pickWebInteractionHandlers(props)).toEqual({ onBlur });
});

describe('output matches the implementation it replaced', () => {
	const keys = [
		'onContextMenu',
		'onDragStart',
		'onKeyDown',
		'onKeyUp',
		'onMouseDown',
		'onMouseEnter',
		'onMouseLeave',
		'onMouseUp',
		'onPointerDown',
		'onPointerEnter',
		'onPointerLeave',
		'onPointerUp',
		'onTouchCancel',
		'onTouchEnd',
		'onTouchMove',
		'onTouchStart',
		'onFocus',
		'onBlur',
	];

	const reference = (props: Record<string, unknown>): Record<string, unknown> => {
		const picked: Record<string, unknown> = {};
		for (const key of keys) {
			if (props[key] !== undefined) {
				picked[key] = props[key];
			}
		}
		return picked;
	};

	const handler = () => undefined;
	const table: Record<string, unknown>[] = [
		{},
		{ onFocus: handler },
		{ onBlur: undefined, onFocus: handler },
		{ onBlur: handler, onFocus: handler, onKeyDown: handler },
		{ onClick: handler, onPress: handler, className: 'x', children: 'c', id: 'i' },
		{ onTouchStart: handler, onContextMenu: handler, onMouseDown: handler, onPointerUp: handler, onKeyUp: null },
		Object.fromEntries(keys.map((key) => [key, handler])),
		Object.fromEntries(keys.map((key) => [key, undefined])),
		{ onmousedown: handler, onMouseDownCapture: handler },
	];

	it.each(table.map((props, index) => [index, props] as const))('table row %#', (_, props) => {
		const actual = pickWebInteractionHandlers(props);
		const expected = reference(props);

		expect(actual).toEqual(expected);
		// Spread order never changes what an element receives, so only the set of keys is compared
		expect(Object.keys(actual).sort()).toEqual(Object.keys(expected).sort());
	});
});
