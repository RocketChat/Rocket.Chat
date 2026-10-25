/** Tells whether the `disabled` or `is-disabled` class name pins a component to its disabled look. */
export const isForcedDisabled = (className: string | undefined) =>
	className?.split(/\s+/).some((name) => name === 'disabled' || name === 'is-disabled') ?? false;
