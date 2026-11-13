/**
 * Read from the scroll container itself: the virtualizer's own scroll size leaves out what surrounds its rows.
 */
export type ScrollGeometry = {
	scrollTop: number;
	scrollHeight: number;
	clientHeight: number;
};

const SUB_PIXEL_TOLERANCE = 1;
const OLDER_PAGE_VIEWPORT_FRACTION = 1 / 3;

export const distanceFromBottom = ({ scrollTop, scrollHeight, clientHeight }: ScrollGeometry) => scrollHeight - clientHeight - scrollTop;

/** How near the bottom counts as the bottom, in pixels: a sub-pixel distance, unless the list is told to be more forgiving. */
export const DEFAULT_BOTTOM_THRESHOLD = SUB_PIXEL_TOLERANCE;

export const isAtBottom = (geometry: ScrollGeometry, threshold = DEFAULT_BOTTOM_THRESHOLD) => distanceFromBottom(geometry) <= threshold;

/**
 * Whether the viewport is close enough to the first message to fetch older ones.
 * @param messagesStart offset of the first message row, below the older loader
 */
export const isNearOlderEdge = (geometry: ScrollGeometry, messagesStart: number) =>
	geometry.scrollTop - messagesStart <= geometry.clientHeight * OLDER_PAGE_VIEWPORT_FRACTION;

export const isNearNewerEdge = (geometry: ScrollGeometry, threshold = DEFAULT_BOTTOM_THRESHOLD) => isAtBottom(geometry, threshold);
