import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { RefCallback } from 'react';
import { useCallback } from 'react';

import type { PictureExtent, ScreenZoom, ScreenZoomChange } from './screenZoom.js';
import { confineTo, panBy, zoomTo } from './screenZoom.js';

const KEY_PAN_STEP = 0.1;

const KEY_PANS: Partial<Record<string, [dx: number, dy: number]>> = {
	ArrowLeft: [KEY_PAN_STEP, 0],
	ArrowRight: [-KEY_PAN_STEP, 0],
	ArrowUp: [0, KEY_PAN_STEP],
	ArrowDown: [0, -KEY_PAN_STEP],
};

// A trackpad pinch arrives as a ctrl+wheel of a few pixels at a time, a mouse notch as about a hundred; capped so a
// notch zooms by a step rather than all the way.
const WHEEL_ZOOM_RATE = 0.01;
const MAX_WHEEL_DELTA_PX = 50;
const WHEEL_LINE_PX = 16;

const wheelDeltaPx = ({ deltaY, deltaMode }: WheelEvent) => (deltaMode === WheelEvent.DOM_DELTA_LINE ? deltaY * WHEEL_LINE_PX : deltaY);

type ScreenZoomGestures = {
	zoomed: boolean;
	extent: PictureExtent;
	onZoomChange: (change: ScreenZoomChange) => void;
};

/**
 * The gestures over a shared screen, for the viewer the returned ref is on: ctrl+wheel and trackpad pinches zoom
 * around the pointer; once zoomed, dragging and the arrow keys move around the screen.
 */
export const useScreenZoomGestures = ({ zoomed, extent, onZoomChange }: ScreenZoomGestures): RefCallback<HTMLElement> => {
	const change = useStableCallback((change: (zoom: ScreenZoom, extent: PictureExtent) => ScreenZoom) =>
		onZoomChange((zoom) => change(confineTo(zoom, extent), extent)),
	);

	return useCallback(
		(node: HTMLElement) => {
			let drag: { pointerId: number; clientX: number; clientY: number } | undefined;

			// Without ctrl the wheel is left to scroll; with it, the browser would zoom the whole page instead of the screen.
			const onWheel = (event: WheelEvent) => {
				if (!event.ctrlKey) {
					return;
				}
				event.preventDefault();

				const { left, top, width, height } = node.getBoundingClientRect();
				const focus = { x: (event.clientX - left) / width - 0.5, y: (event.clientY - top) / height - 0.5 };
				const delta = Math.min(MAX_WHEEL_DELTA_PX, Math.max(-MAX_WHEEL_DELTA_PX, wheelDeltaPx(event)));
				change((zoom, extent) => zoomTo(zoom, zoom.scale * Math.exp(-delta * WHEEL_ZOOM_RATE), focus, extent));
			};

			const onPointerDown = (event: PointerEvent) => {
				if (event.button !== 0) {
					return;
				}
				drag = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY };
				node.setPointerCapture(event.pointerId);
			};

			const onPointerMove = (event: PointerEvent) => {
				if (drag?.pointerId !== event.pointerId) {
					return;
				}
				const { width, height } = node.getBoundingClientRect();
				const dx = (event.clientX - drag.clientX) / width;
				const dy = (event.clientY - drag.clientY) / height;
				drag = { ...drag, clientX: event.clientX, clientY: event.clientY };
				change((zoom, extent) => panBy(zoom, dx, dy, extent));
			};

			const onPointerEnd = (event: PointerEvent) => {
				if (drag?.pointerId === event.pointerId) {
					drag = undefined;
				}
			};

			// With a modifier the arrows belong to the browser: history, text selection, the screen reader.
			const onKeyDown = (event: KeyboardEvent) => {
				const pan = KEY_PANS[event.key];
				if (!pan || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
					return;
				}
				event.preventDefault();
				change((zoom, extent) => panBy(zoom, ...pan, extent));
			};

			node.addEventListener('wheel', onWheel, { passive: false });
			if (!zoomed) {
				return () => node.removeEventListener('wheel', onWheel);
			}

			node.addEventListener('pointerdown', onPointerDown);
			node.addEventListener('pointermove', onPointerMove);
			node.addEventListener('pointerup', onPointerEnd);
			node.addEventListener('pointercancel', onPointerEnd);
			node.addEventListener('keydown', onKeyDown);

			return () => {
				node.removeEventListener('wheel', onWheel);
				node.removeEventListener('pointerdown', onPointerDown);
				node.removeEventListener('pointermove', onPointerMove);
				node.removeEventListener('pointerup', onPointerEnd);
				node.removeEventListener('pointercancel', onPointerEnd);
				node.removeEventListener('keydown', onKeyDown);
			};
		},
		[zoomed, change],
	);
};
