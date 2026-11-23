import { useCallback, useState } from 'react';

import type { ScreenZoom, ScreenZoomChange } from './screenZoom.js';
import { MAX_ZOOM_SCALE, UNZOOMED, ZOOM_SCALE_STEP, zoomTo } from './screenZoom.js';

type ScreenZoomState = {
	zoom: ScreenZoom;
	changeZoom: (change: ScreenZoomChange) => void;
	zoomIn: () => void;
	zoomOut: () => void;
	canZoomIn: boolean;
	canZoomOut: boolean;
};

/** How far the shared screen `screenId` is zoomed into. Another screen starts unzoomed. */
export const useScreenZoom = (screenId: string): ScreenZoomState => {
	const [state, setState] = useState({ screenId, zoom: UNZOOMED });
	const zoom = state.screenId === screenId ? state.zoom : UNZOOMED;

	const changeZoom = useCallback(
		(change: ScreenZoomChange) =>
			setState((prev) => {
				const current = prev.screenId === screenId ? prev.zoom : UNZOOMED;
				const next = change(current);
				return next === prev.zoom && prev.screenId === screenId ? prev : { screenId, zoom: next };
			}),
		[screenId],
	);

	const zoomIn = useCallback(() => changeZoom((zoom) => zoomTo(zoom, zoom.scale + ZOOM_SCALE_STEP)), [changeZoom]);
	const zoomOut = useCallback(() => changeZoom((zoom) => zoomTo(zoom, zoom.scale - ZOOM_SCALE_STEP)), [changeZoom]);

	return { zoom, changeZoom, zoomIn, zoomOut, canZoomIn: zoom.scale < MAX_ZOOM_SCALE, canZoomOut: zoom.scale > UNZOOMED.scale };
};
