export type ForcedState = 'hover' | 'press' | 'focus' | 'focusVisible';

const forcedStateByClassName: Record<string, ForcedState> = {
	'hover': 'hover',
	'is-hovered': 'hover',
	'active': 'press',
	'is-active': 'press',
	'focus': 'focus',
	'is-focused': 'focus',
};

/** Reads the state a component is pinned to through the state class names its SCSS used to style. */
export const getForcedState = (className: string | undefined): ForcedState | undefined => {
	const names = className?.split(/\s+/) ?? [];

	if (names.includes('focus') && names.includes('focus-visible')) {
		return 'focusVisible';
	}

	return names.map((name) => forcedStateByClassName[name]).find(Boolean);
};

/** Tells whether the `disabled` or `is-disabled` class name pins a component to its disabled look. */
export const isForcedDisabled = (className: string | undefined) =>
	className?.split(/\s+/).some((name) => name === 'disabled' || name === 'is-disabled') ?? false;
