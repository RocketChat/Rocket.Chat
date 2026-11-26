import type { ElementType, ReactElement } from 'react';

import { resolveHost as resolveWebHost, resolveTextHost as resolveWebTextHost } from './resolveHost';
import { resolveHost, resolveTextHost } from './resolveHost.native';

jest.mock(
	'react-native',
	() => ({ Image: 'RNImage', Pressable: 'RNPressable', Text: 'RNText', TextInput: 'RNTextInput', View: 'RNView' }),
	{ virtual: true },
);

const hostElement = (host: ElementType, props: Record<string, unknown>) =>
	(host as (props: Record<string, unknown>) => ReactElement)(props);

describe('resolveHost on native', () => {
	it.each(['span', 'p', 'h1', 'h6', 'label', 'strong', 'em', 'small', 'a', 'code', 'time'] as const)('renders <%s> as Text', (tag) => {
		expect(hostElement(resolveHost(tag), {}).type).toBe('RNText');
	});

	it.each(['input', 'textarea'] as const)('renders <%s> as TextInput', (tag) => {
		expect(resolveHost(tag)).toBe('RNTextInput');
	});

	it('renders <img> as Image', () => {
		expect(resolveHost('img')).toBe('RNImage');
	});

	it.each(['div', 'section', 'ul', 'li', 'header', 'button'] as const)('renders <%s> as View', (tag) => {
		expect(hostElement(resolveHost(tag), {}).type).toBe('RNView');
	});

	describe('with press handlers', () => {
		it('keeps the props of a View nobody presses', () => {
			const props = { testID: 'box', disabled: true };
			const rendered = hostElement(resolveHost('div'), props);

			expect(rendered.type).toBe('RNView');
			expect(rendered.props).toEqual(props);
		});

		it.each([
			['onClick', 'onPress'],
			['onPress', 'onPress'],
			['onPressIn', 'onPressIn'],
			['onPressOut', 'onPressOut'],
			['onLongPress', 'onLongPress'],
		])('renders a View with %s as a Pressable with %s', (from, to) => {
			const handler = jest.fn();
			const rendered = hostElement(resolveHost('div'), { [from]: handler, 'role': 'button', 'aria-label': 'Show', 'disabled': true });
			const props = rendered.props as Record<string, () => void>;

			expect(rendered.type).toBe('RNPressable');
			expect(props).toMatchObject({ 'role': 'button', 'aria-label': 'Show', 'disabled': true });
			expect(props).not.toHaveProperty('onClick');
			props[to]?.();
			expect(handler).toHaveBeenCalledTimes(1);
		});

		it('maps the pointer events to press in and out', () => {
			const onPointerDown = jest.fn();
			const onPointerUp = jest.fn();
			const props = hostElement(resolveHost('div'), { onClick: jest.fn(), onPointerDown, onPointerUp }).props as Record<string, () => void>;

			props.onPressIn?.();
			props.onPressOut?.();

			expect(onPointerDown).toHaveBeenCalledTimes(1);
			expect(onPointerUp).toHaveBeenCalledTimes(1);
			expect(props).not.toHaveProperty('onPointerDown');
		});

		it('gives a Text its own press events instead of wrapping it', () => {
			const onClick = jest.fn();
			const rendered = hostElement(resolveHost('i'), { onClick, children: 'x' });
			const props = rendered.props as Record<string, unknown>;

			expect(rendered.type).toBe('RNText');
			expect(props).not.toHaveProperty('onClick');
			(props.onPress as () => void)();
			expect(onClick).toHaveBeenCalledTimes(1);
			expect(props).toHaveProperty('children', 'x');
		});

		it('keeps the props of a Text nobody presses', () => {
			expect(hostElement(resolveHost('span'), { testID: 't' }).props).toEqual({ testID: 't' });
		});

		it('does not wrap an input or an image', () => {
			expect(resolveHost('input')).toBe('RNTextInput');
			expect(resolveHost('img')).toBe('RNImage');
		});
	});

	it('returns a component as it is', () => {
		const Component = () => null;
		expect(resolveHost(Component)).toBe(Component);
		expect(resolveTextHost(Component)).toBe(Component);
	});

	it('renders any text tag as Text', () => {
		expect(resolveTextHost('li')).toBe('RNText');
		expect(resolveTextHost('div')).toBe('RNText');
	});
});

describe('resolveHost on web', () => {
	it('returns the tag name unchanged', () => {
		expect(resolveWebHost('div')).toBe('div');
		expect(resolveWebTextHost('li')).toBe('li');
	});
});
