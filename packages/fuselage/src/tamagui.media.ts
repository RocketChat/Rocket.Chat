/**
 * The conditions a frame value can depend on besides a state: what the device can do, what the user asked for, and the
 * width of a named group. A frame names one as a key of the value, `{ default: 4, pointerCoarse: 8 }`; a width is read
 * from a group, `'@narrow/itemGroup'`, never from the viewport.
 */
export const media = {
	/** The main pointer is a finger: targets need more room. */
	pointerCoarse: { pointer: 'coarse' },
	/** Nothing hovers: what a hover reveals is shown. */
	hoverNone: { hover: 'none' },
	/** The user asked for less motion. */
	reducedMotion: { prefersReducedMotion: 'reduce' },
	/**
	 * A group too narrow for a row's widest layout: 20rem at most, so it follows the user's font size. Native has no rem,
	 * and measures a group by its density-independent pixels.
	 */
	narrow: process.env.TAMAGUI_TARGET === 'native' ? { maxWidth: 320 } : { maxWidth: '20rem' },
} as const;
