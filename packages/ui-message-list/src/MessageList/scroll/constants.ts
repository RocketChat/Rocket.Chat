/** How long a jump target stays highlighted. */
export const HIGHLIGHT_DURATION_MS = 2000;

/** How long a held message is released after its surroundings stop resizing: images resolve well after the first layout. */
export const MESSAGE_ANCHOR_RELEASE_MS = 3000;

/** Frames without any change of size or position after which the list counts as placed. */
export const POSITIONING_STABLE_FRAMES = 5;

/** Placing the list never takes longer than this, even while content keeps resizing. */
export const POSITIONING_TIMEOUT_MS = 2000;

/** The rows are kept out of sight while the list places itself for no longer than this. */
export const REVEAL_DEADLINE_MS = 500;

/** A scroll gesture that moves nothing (already at an edge) closes the user-scrolling window after this. */
export const USER_INPUT_WITHOUT_SCROLL_MS = 300;

/** How long the floating date stays after the last scroll. */
export const DATE_BUBBLE_IDLE_MS = 1000;

export const POSITION_REPORT_DEBOUNCE_MS = 150;

export const SCROLL_KEYS = ['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown', ' '];
