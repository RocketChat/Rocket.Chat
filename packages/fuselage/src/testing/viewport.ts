import { waitFor } from 'storybook/test';

/**
 * Renders another story of the Storybook this one runs in, in an iframe `width` pixels wide, and hands its document to `read`:
 * the only way a `play` function gets the media queries of a narrower viewport. Browser only, and `storyId` must name a story
 * whose own `play` does not call this, or the iframes would nest.
 */
export const atViewport = async <T>(width: number, storyId: string, read: (document: Document) => T | Promise<T>): Promise<T> => {
	const frame = document.createElement('iframe');
	frame.style.cssText = `position:fixed;top:0;left:0;width:${width}px;height:700px;opacity:0;pointer-events:none;border:0`;
	frame.src = new URL(`iframe.html?id=${storyId}&viewMode=story`, window.location.href).href;
	document.body.append(frame);

	try {
		await waitFor(
			() => {
				const root = frame.contentDocument?.querySelector('#storybook-root');
				if (!root?.firstElementChild || frame.contentDocument?.body.classList.contains('sb-show-preparing-story'))
					throw new Error('not rendered');
			},
			{ timeout: 20000 },
		);
		return await read(frame.contentDocument as Document);
	} finally {
		frame.remove();
	}
};
