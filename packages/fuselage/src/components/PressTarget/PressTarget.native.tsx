import type { AriaAttributes, ReactNode } from 'react';
import { Pressable } from 'react-native';

import { mapPressHandlers } from '../../helpers/mapPressHandlers';
import type { ActionAccessibilityAttributes, LongPressEvents, PressEvents } from '../../types/Attributes.contract';

export type PressTargetProps = {
	press: PressEvents &
		LongPressEvents &
		ActionAccessibilityAttributes &
		Pick<AriaAttributes, 'aria-checked'> & {
			/** The web alias of `onPress`; React Native has no click event to hand it. */
			onClick?: () => void;
			onPointerDown?: () => void;
			onPointerUp?: () => void;
			disabled?: boolean;
		};
	children: ReactNode;
};

const accessibilityKeys = [
	'role',
	'aria-label',
	'aria-labelledby',
	'aria-describedby',
	'aria-controls',
	'aria-current',
	'aria-disabled',
	'aria-expanded',
	'aria-haspopup',
	'aria-hidden',
	'aria-live',
	'aria-pressed',
	'aria-selected',
	'aria-checked',
] as const satisfies readonly (keyof PressTargetProps['press'])[];

const accessibilityRoles: ReadonlySet<string> = new Set(['button', 'link', 'switch', 'checkbox', 'radio', 'tab', 'menuitem']);

const toBoolean = (value: boolean | 'true' | 'false' | undefined) => (value === undefined ? undefined : value === true || value === 'true');

const toChecked = (value: boolean | 'true' | 'false' | 'mixed' | undefined) => (value === 'mixed' ? 'mixed' : toBoolean(value));

/**
 * Makes the frame it wraps pressable: the web-style handlers of `press` become the press events of a `Pressable`, and a
 * part nobody listens to stays unwrapped.
 *
 * It costs one extra native node, and the frame's hover, focus and pressed visuals are not visible to it; handing the
 * frame a `pressed` signal is out of scope.
 */
export const PressTarget = ({ press, children }: PressTargetProps) => {
	const handlers = mapPressHandlers(press);

	if (!Object.keys(handlers).length) {
		return <>{children}</>;
	}

	const pressable: Record<string, unknown> = { ...handlers };
	// `press` is the whole props object of the part, so only the accessibility keys are forwarded
	for (const key of accessibilityKeys) {
		if (press[key] !== undefined) {
			pressable[key] = press[key];
		}
	}
	if (press.role && accessibilityRoles.has(press.role)) {
		pressable.accessibilityRole = press.role;
	}

	const state = {
		disabled: press.disabled ?? toBoolean(press['aria-disabled']),
		checked: toChecked(press['aria-checked']),
		selected: toBoolean(press['aria-selected']),
		expanded: toBoolean(press['aria-expanded']),
	};
	const accessibilityState = Object.fromEntries(Object.entries(state).filter(([, value]) => value !== undefined));
	if (Object.keys(accessibilityState).length) {
		pressable.accessibilityState = accessibilityState;
	}

	if (press.disabled !== undefined) {
		pressable.disabled = press.disabled;
	}

	return <Pressable {...pressable}>{children}</Pressable>;
};
