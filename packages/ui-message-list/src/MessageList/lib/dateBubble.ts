/** A day divider drawn in the list, with its top measured from the top of the viewport. */
export type DayDividerBox = {
	top: number;
	height: number;
	day: Date;
};

export type DateBubblePlacement = {
	/** The day the floating date shows, when there is one to show. */
	date: Date | undefined;
	/** How far the next day's divider pushes the floating date up, in pixels: zero or less. */
	offset: number;
	/** The divider the floating date stands in for, hidden while it does. */
	covered: number | undefined;
	/**
	 * The divider the floating date stands in for lies above the top of the list but below the top of the window, so it stays
	 * until the next scroll.
	 */
	isHeld: boolean;
};

export type DateBubbleFrame = {
	/** Where the top of the window is, measured from the top of the viewport: zero or less. */
	windowTop: number;
};

/** A divider further above the top of the viewport than this is no longer under the floating date. */
const DIVIDER_NEAR_TOP_PX = 100;

/**
 * Places the floating date for the dividers drawn in the list, ordered top to bottom: it stands in for the last divider at
 * or above the top of the viewport, and the divider of the next day pushes it up as it comes within its own height of the
 * top. With no divider near the top it shows the day of the message at the top. It stays without fading while the divider it
 * stands in for is above the top of the list and below the top of the window.
 */
export const placeDateBubble = (
	dividers: readonly DayDividerBox[],
	topMessageDate: Date | undefined,
	{ windowTop }: DateBubbleFrame,
): DateBubblePlacement => {
	let date: Date | undefined;
	let covered: number | undefined;
	let offset = 0;
	let isPushed = false;

	dividers.forEach((divider, index) => {
		if (divider.top + DIVIDER_NEAR_TOP_PX < 0 || divider.top >= divider.height) {
			return;
		}

		if (divider.top > 0) {
			date = date ?? topMessageDate ?? divider.day;
			offset = divider.top - divider.height;
			isPushed = true;
			return;
		}

		date = divider.day;
		covered = index;
		offset = 0;
		isPushed = false;
	});

	const coveredDivider = covered === undefined ? undefined : dividers[covered];

	return {
		date: date ?? topMessageDate,
		offset,
		// Pushed out by the next day, the floating date no longer stands in for the divider above
		covered: isPushed ? undefined : covered,
		isHeld: !!coveredDivider && coveredDivider.top > windowTop && coveredDivider.top < 0,
	};
};
