/**
 * How far a shared screen is zoomed into, and where its centre sits from the centre of the viewer showing it.
 * `x` and `y` are fractions of the viewer's width and height, so the same part of the screen stays in view
 * whatever size the viewer is, fullscreen or not.
 */
export type ScreenZoom = { scale: number; x: number; y: number };

export const UNZOOMED: ScreenZoom = { scale: 1, x: 0, y: 0 };

export const MAX_ZOOM_SCALE = 4;

export const ZOOM_SCALE_STEP = 0.5;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// The screen always covers the viewer: it moves no further than the part of it that overhangs.
const confine = ({ scale, x, y }: ScreenZoom): ScreenZoom => {
	const overhang = (scale - 1) / 2;
	return { scale, x: clamp(x, -overhang, overhang), y: clamp(y, -overhang, overhang) };
};

/** Zooms to `scale`, keeping the point at `focus`, measured from the viewer's centre, where it is on screen. */
export const zoomTo = (zoom: ScreenZoom, scale: number, focus = { x: 0, y: 0 }): ScreenZoom => {
	const next = clamp(scale, UNZOOMED.scale, MAX_ZOOM_SCALE);
	const ratio = next / zoom.scale;
	return confine({ scale: next, x: focus.x - (focus.x - zoom.x) * ratio, y: focus.y - (focus.y - zoom.y) * ratio });
};

/** Moves the zoomed screen by a fraction of the viewer's size; the same zoom when it cannot move that way. */
export const panBy = (zoom: ScreenZoom, dx: number, dy: number): ScreenZoom => {
	const next = confine({ scale: zoom.scale, x: zoom.x + dx, y: zoom.y + dy });
	return next.x === zoom.x && next.y === zoom.y ? zoom : next;
};

/** The CSS transform that shows the screen zoomed, for an element the size of its viewer. */
export const screenZoomTransform = ({ scale, x, y }: ScreenZoom): string | undefined =>
	scale === UNZOOMED.scale ? undefined : `translate(${x * 100}%, ${y * 100}%) scale(${scale})`;
