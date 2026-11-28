import type { ReactElement } from 'react';

import { PressTarget as renderPressTarget } from './PressTarget.native';

jest.mock('react-native', () => ({ Pressable: 'RNPressable' }), { virtual: true });

const child = <span>Tag</span>;

const press = (props: Parameters<typeof renderPressTarget>[0]['press']) =>
	renderPressTarget({ press: props, children: child }) as ReactElement<Record<string, unknown>>;

describe('PressTarget on React Native', () => {
	it('renders the children unwrapped when nobody listens', () => {
		expect(press({}).props.children).toBe(child);
		expect(press({}).type).not.toBe('RNPressable');
		expect(press({ 'disabled': true, 'role': 'button', 'aria-label': 'Tag' }).type).not.toBe('RNPressable');
	});

	it.each([
		['onPress', 'onPress'],
		['onClick', 'onPress'],
		['onPointerDown', 'onPressIn'],
		['onPointerUp', 'onPressOut'],
		['onLongPress', 'onLongPress'],
	] as const)('maps %s to %s and nothing else', (from, to) => {
		const handler = jest.fn();
		const element = press({ [from]: handler });

		expect(element.type).toBe('RNPressable');
		expect(element.props.children).toBe(child);
		expect(Object.keys(element.props).filter((key) => key !== 'children')).toEqual([to]);
		(element.props[to] as () => void)();
		expect(handler).toHaveBeenCalledTimes(1);
		expect(handler).toHaveBeenCalledWith();
	});

	it('fires the deprecated onClick before onPress', () => {
		const calls: string[] = [];
		const element = press({ onClick: () => calls.push('onClick'), onPress: () => calls.push('onPress') });

		(element.props.onPress as () => void)();

		expect(calls).toEqual(['onClick', 'onPress']);
	});

	it('passes the disabled state, the role and the ARIA states through', () => {
		const element = press({ 'onPress': jest.fn(), 'disabled': true, 'role': 'link', 'aria-label': 'Open', 'aria-expanded': false });

		expect(element.props).toMatchObject({ 'disabled': true, 'role': 'link', 'aria-label': 'Open', 'aria-expanded': false });
	});

	it('forwards nothing besides the accessibility keys of a whole props object', () => {
		const whole = { 'onPress': jest.fn(), 'children': 'Tag', 'variant': 'primary', 'id': 'x', 'data-qa': 'y' };
		const element = press(whole);

		expect(Object.keys(element.props).sort()).toEqual(['children', 'onPress']);
	});

	it('adds a key only for a handler that exists', () => {
		const element = press({ onPointerDown: jest.fn(), disabled: undefined });

		expect(Object.keys(element.props).sort()).toEqual(['children', 'onPressIn']);
	});

	it.each(['button', 'link', 'switch', 'checkbox'] as const)('maps the role %s to accessibilityRole', (role) => {
		const element = press({ onPress: jest.fn(), role });

		expect(element.props).toMatchObject({ role, accessibilityRole: role });
	});

	it('sets no accessibilityRole for a role React Native has none for', () => {
		expect(press({ onPress: jest.fn(), role: 'presentation' }).props).not.toHaveProperty('accessibilityRole');
	});

	it('maps the ARIA states to accessibilityState', () => {
		const element = press({
			'onPress': jest.fn(),
			'aria-disabled': 'true',
			'aria-checked': 'mixed',
			'aria-selected': false,
			'aria-expanded': true,
		});

		expect(element.props.accessibilityState).toEqual({ disabled: true, checked: 'mixed', selected: false, expanded: true });
	});

	it('lets disabled win over aria-disabled', () => {
		const element = press({ 'onPress': jest.fn(), 'disabled': false, 'aria-disabled': true });

		expect(element.props.accessibilityState).toEqual({ disabled: false });
	});

	it('sets no accessibilityState when no state is given', () => {
		expect(press({ onPress: jest.fn() }).props).not.toHaveProperty('accessibilityState');
	});
});
