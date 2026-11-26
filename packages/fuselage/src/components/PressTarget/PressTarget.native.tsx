import type { AriaAttributes, ReactNode } from 'react';
import { Pressable } from 'react-native';

import type { ActionAccessibilityAttributes, LongPressEvents, PressEvents } from '../../types/Attributes.contract';

/** Layout of the wrapped frame the `Pressable` has to keep, so that wrapping it does not change its size or place. */
type PressLayout = {
	alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
	flex?: number;
	flexGrow?: number;
	flexShrink?: number;
	width?: number | `${number}%`;
	height?: number | `${number}%`;
};

export type PressTargetProps = {
	press: PressEvents &
		LongPressEvents &
		ActionAccessibilityAttributes &
		Pick<AriaAttributes, 'aria-checked'> &
		PressLayout & {
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

const layoutKeys = ['alignSelf', 'flex', 'flexGrow', 'flexShrink', 'width', 'height'] as const satisfies readonly (keyof PressLayout)[];

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
	const { onPress, onClick, onPointerDown, onPointerUp, onLongPress, disabled } = press;

	if (!onPress && !onClick && !onPointerDown && !onPointerUp && !onLongPress) {
		return <>{children}</>;
	}

	const pressable: Record<string, unknown> = {};
	// `press` is the whole props object of the part, so only the accessibility and layout keys are forwarded
	for (const key of accessibilityKeys) {
		if (press[key] !== undefined) {
			pressable[key] = press[key];
		}
	}
	if (press.role && accessibilityRoles.has(press.role)) {
		pressable.accessibilityRole = press.role;
	}

	const state = {
		disabled: disabled ?? toBoolean(press['aria-disabled']),
		checked: toChecked(press['aria-checked']),
		selected: toBoolean(press['aria-selected']),
		expanded: toBoolean(press['aria-expanded']),
	};
	const accessibilityState = Object.fromEntries(Object.entries(state).filter(([, value]) => value !== undefined));
	if (Object.keys(accessibilityState).length) {
		pressable.accessibilityState = accessibilityState;
	}

	const style = Object.fromEntries(layoutKeys.filter((key) => press[key] !== undefined).map((key) => [key, press[key]]));
	if (Object.keys(style).length) {
		pressable.style = style;
	}

	if (onPress || onClick) {
		pressable.onPress = () => {
			onClick?.();
			onPress?.();
		};
	}
	if (onPointerDown) {
		pressable.onPressIn = onPointerDown;
	}
	if (onPointerUp) {
		pressable.onPressOut = onPointerUp;
	}
	if (onLongPress) {
		pressable.onLongPress = onLongPress;
	}
	if (disabled !== undefined) {
		pressable.disabled = disabled;
	}

	return <Pressable {...pressable}>{children}</Pressable>;
};
