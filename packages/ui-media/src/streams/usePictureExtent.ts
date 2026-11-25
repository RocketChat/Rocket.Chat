import type { RefCallback } from 'react';
import { useCallback, useState } from 'react';

import type { PictureExtent } from './screenZoom.js';
import { WHOLE_VIEWER, pictureExtent } from './screenZoom.js';

/** How much of the element the returned ref is on the picture of the video inside it covers, as either resizes. */
export const usePictureExtent = (): [ref: RefCallback<HTMLElement>, extent: PictureExtent] => {
	const [extent, setExtent] = useState(WHOLE_VIEWER);

	const ref = useCallback((node: HTMLElement) => {
		const update = () => {
			const video = node.querySelector('video');
			const next = pictureExtent(node.getBoundingClientRect(), { width: video?.videoWidth ?? 0, height: video?.videoHeight ?? 0 });
			setExtent((prev) => (prev.x === next.x && prev.y === next.y ? prev : next));
		};

		update();
		const observer = new ResizeObserver(update);
		observer.observe(node);
		// Neither event bubbles, so they are caught on the way down to the video.
		node.addEventListener('resize', update, true);
		node.addEventListener('loadedmetadata', update, true);

		return () => {
			observer.disconnect();
			node.removeEventListener('resize', update, true);
			node.removeEventListener('loadedmetadata', update, true);
		};
	}, []);

	return [ref, extent];
};
