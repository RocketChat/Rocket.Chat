/**
 * How far a shared screen is zoomed into, and where its centre sits from the centre of the viewer showing it.
 * `x` and `y` are fractions of the viewer's width and height, so the same part of the screen stays in view
 * whatever size the viewer is, fullscreen or not.
 */
export type ScreenZoom = { scale: number; x: number; y: number };

export type ScreenZoomChange = (zoom: ScreenZoom) => ScreenZoom;

/** The fraction of the viewer the unzoomed picture covers on each axis: less than 1 where it is letterboxed. */
export type PictureExtent = { x: number; y: number };

type Size = { width: number; height: number };

export const UNZOOMED: ScreenZoom = { scale: 1, x: 0, y: 0 };

export const WHOLE_VIEWER: PictureExtent = { x: 1, y: 1 };

export const MAX_ZOOM_SCALE = 4;

export const ZOOM_SCALE_STEP = 0.5;

// `|| 0` because clamping to a zero range can give -0, which is not the 0 of `UNZOOMED`
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value)) || 0;

const overhang = (scale: number, extent: number) => Math.max(0, (scale * extent - 1) / 2);

/** The extent of a picture letterboxed into a viewer; the whole viewer until both have a size. */
export const pictureExtent = (viewer: Size, picture: Size): PictureExtent => {
	if (!viewer.width || !viewer.height || !picture.width || !picture.height) {
		return WHOLE_VIEWER;
	}

	const fit = Math.min(viewer.width / picture.width, viewer.height / picture.height);
	return { x: (picture.width * fit) / viewer.width, y: (picture.height * fit) / viewer.height };
};

/**
 * Keeps the picture over the viewer: it moves no further than the part of it that overhangs, and stays centred on an
 * axis it does not fill. The same zoom when it already is.
 */
export const confineTo = (zoom: ScreenZoom, extent: PictureExtent = WHOLE_VIEWER): ScreenZoom => {
	const x = clamp(zoom.x, -overhang(zoom.scale, extent.x), overhang(zoom.scale, extent.x));
	const y = clamp(zoom.y, -overhang(zoom.scale, extent.y), overhang(zoom.scale, extent.y));
	return x === zoom.x && y === zoom.y ? zoom : { scale: zoom.scale, x, y };
};

/** Zooms to `scale`, keeping the point at `focus`, measured from the viewer's centre, where it is on screen. */
export const zoomTo = (zoom: ScreenZoom, scale: number, focus = { x: 0, y: 0 }, extent?: PictureExtent): ScreenZoom => {
	const next = clamp(scale, UNZOOMED.scale, MAX_ZOOM_SCALE);
	const ratio = next / zoom.scale;
	return confineTo({ scale: next, x: focus.x - (focus.x - zoom.x) * ratio, y: focus.y - (focus.y - zoom.y) * ratio }, extent);
};

/** Moves the zoomed screen by a fraction of the viewer's size; the same zoom when it cannot move that way. */
export const panBy = (zoom: ScreenZoom, dx: number, dy: number, extent?: PictureExtent): ScreenZoom => {
	const next = confineTo({ scale: zoom.scale, x: zoom.x + dx, y: zoom.y + dy }, extent);
	return next.x === zoom.x && next.y === zoom.y ? zoom : next;
};

/** The CSS transform that shows the screen zoomed, for an element the size of its viewer. */
export const screenZoomTransform = ({ scale, x, y }: ScreenZoom): string | undefined =>
	scale === UNZOOMED.scale ? undefined : `translate(${x * 100}%, ${y * 100}%) scale(${scale})`;
