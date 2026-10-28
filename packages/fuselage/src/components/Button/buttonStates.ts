import type { ButtonSegment } from './ButtonSegmentContext';
import type { ButtonKind } from './buttonColors';

export const pressableKinds = ['icon', 'icon-info', 'icon-success', 'icon-warning', 'icon-danger'] as const;

type PressableKind = (typeof pressableKinds)[number];

export type ButtonLook = ButtonKind | `${PressableKind}-pressed` | `${ButtonKind}-disabled`;

/** Names a combination of the variants `ButtonFrame` merges into one. */
export const variantKey = (...values: (string | boolean | undefined)[]) =>
	['', ...values.map((value) => (value === true ? 'true' : value || ''))].join('|');

const getLook = (kind: ButtonKind, disabled: boolean | undefined, pressed: boolean | undefined): ButtonLook => {
	if (disabled) return `${kind}-disabled`;
	const pressable = pressed ? pressableKinds.find((candidate) => candidate === kind) : undefined;
	return pressable ? `${pressable}-pressed` : kind;
};

/** The color variants in the order they override each other. */
export const getButtonStates = (
	kind: ButtonKind,
	disabled: boolean | undefined,
	segment: ButtonSegment | undefined,
	pressed?: boolean,
) => ({
	look: getLook(kind, disabled, pressed),
	segment: segment?.position,
	ghost: segment?.ghost ? segment.variant : undefined,
});
