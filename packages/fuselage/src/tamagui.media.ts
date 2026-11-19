/**
 * The conditions a frame value can depend on besides a state: what the device can do, what the user asked for, the
 * viewport's breakpoints and the width of a named group. A frame names one as a key of the value,
 * `{ default: 4, pointerCoarse: 8 }`; the width of a part's container is read from a group, `'@narrow/itemGroup'`.
 */
export const media = {
	/** The `sm` breakpoint of `@rocket.chat/fuselage-tokens`: at least 600 pixels wide. */
	sm: { minWidth: 600 },
	/** The `md` breakpoint of `@rocket.chat/fuselage-tokens`: at least 768 pixels wide. */
	md: { minWidth: 768 },
	/** The main pointer is a finger: targets need more room. */
	pointerCoarse: { pointer: 'coarse' },
	/** Nothing hovers: what a hover reveals is shown. */
	hoverNone: { hover: 'none' },
	/** The user asked for less motion. */
	reducedMotion: { prefersReducedMotion: 'reduce' },
	/** A group too narrow for a row's widest layout: under 320 pixels, which a `max-width` can only state from below. */
	narrow: { maxWidth: 319.98 },
} as const;
