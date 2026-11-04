import type { ScreenZoom } from './screenZoom';
import { MAX_ZOOM_SCALE, UNZOOMED, panBy, screenZoomTransform, zoomTo } from './screenZoom';

// Where a point of the screen, measured from its centre before zooming, ends up from the viewer's centre.
const onScreen = ({ scale, x, y }: ScreenZoom, point: { x: number; y: number }) => ({ x: x + point.x * scale, y: y + point.y * scale });

describe('zoomTo', () => {
	it('zooms no further out than the whole screen, and no further in than the maximum', () => {
		expect(zoomTo(UNZOOMED, 0.5).scale).toBe(1);
		expect(zoomTo(UNZOOMED, 10).scale).toBe(MAX_ZOOM_SCALE);
	});

	// So a pinch or a ctrl+wheel zooms into whatever is under the pointer, rather than into the middle of the screen.
	it('keeps the point it zooms around where it was on screen', () => {
		const focus = { x: 0.25, y: -0.1 };
		const once = zoomTo(UNZOOMED, 2, focus);
		const twice = zoomTo(once, 3, focus);

		const point = { x: 0.25, y: -0.1 };
		expect(onScreen(once, point).x).toBeCloseTo(focus.x);
		expect(onScreen(once, point).y).toBeCloseTo(focus.y);
		expect(onScreen(twice, point).x).toBeCloseTo(focus.x);
		expect(onScreen(twice, point).y).toBeCloseTo(focus.y);
	});

	it('pulls the screen back in on zooming out, so it still covers the viewer', () => {
		const zoomed = { scale: 3, x: 1, y: -1 };

		expect(zoomTo(zoomed, 2)).toEqual({ scale: 2, x: 0.5, y: -0.5 });
	});

	it('centres the screen again once it is all in view', () => {
		const out = zoomTo({ scale: 2, x: 0.3, y: -0.2 }, 1);

		expect(out.scale).toBe(1);
		expect(out.x).toBeCloseTo(0);
		expect(out.y).toBeCloseTo(0);
	});
});

describe('panBy', () => {
	it('moves the zoomed screen', () => {
		expect(panBy({ scale: 2, x: 0, y: 0 }, 0.1, -0.2)).toEqual({ scale: 2, x: 0.1, y: -0.2 });
	});

	it('stops at the edge of the screen', () => {
		expect(panBy({ scale: 2, x: 0.4, y: 0 }, 0.3, -2)).toEqual({ scale: 2, x: 0.5, y: -0.5 });
	});

	// The same object, so moving against an edge, or a screen that is not zoomed, does not re-render.
	it('gives back the same zoom when the screen cannot move', () => {
		const atEdge = { scale: 2, x: 0.5, y: 0 };

		expect(panBy(UNZOOMED, 0.2, 0.2)).toBe(UNZOOMED);
		expect(panBy(atEdge, 0.1, 0)).toBe(atEdge);
	});
});

describe('screenZoomTransform', () => {
	it('leaves a screen that is not zoomed untransformed', () => {
		expect(screenZoomTransform(UNZOOMED)).toBeUndefined();
	});

	it('scales the screen and moves it by fractions of its own size', () => {
		expect(screenZoomTransform({ scale: 2, x: 0.25, y: -0.5 })).toBe('translate(25%, -50%) scale(2)');
	});
});
