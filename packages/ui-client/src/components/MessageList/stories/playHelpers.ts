import { expect } from 'storybook/test';

const SETTLE_FRAMES = 3;
const SETTLE_MIN_MS = 200;
const SETTLE_TIMEOUT_MS = 8000;

const nextFrame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve));

export const getViewport = (canvasElement: HTMLElement) => {
	const viewport = canvasElement.querySelector<HTMLElement>('[role="list"]');
	if (!viewport) {
		throw new Error('No message list in the story');
	}
	return viewport;
};

const getListHost = (viewport: HTMLElement) => viewport.closest<HTMLElement>('[data-anchor]');

/**
 * Resolves once the list stopped moving: its scroll position, its height and its anchor and phase stayed the same for a few
 * frames and some time, which covers the virtualizer's own re-measuring.
 */
export const waitForListSettled = async (canvasElement: HTMLElement) => {
	await document.fonts.ready;
	const viewport = getViewport(canvasElement);
	const startedAt = performance.now();
	let last = '';
	let stableFrames = 0;
	let stableSince = performance.now();

	for (;;) {
		const now = await nextFrame();
		const host = getListHost(viewport);
		const current = `${viewport.scrollTop}|${viewport.scrollHeight}|${host?.dataset.anchor}|${host?.dataset.phase}`;

		if (current === last) {
			stableFrames++;
		} else {
			last = current;
			stableFrames = 0;
			stableSince = now;
		}

		if (stableFrames >= SETTLE_FRAMES && now - stableSince >= SETTLE_MIN_MS && host?.dataset.phase === 'idle') {
			return;
		}

		if (now - startedAt > SETTLE_TIMEOUT_MS) {
			throw new Error(`The list did not settle: ${current}`);
		}
	}
};

export const distanceFromBottom = (viewport: HTMLElement) => viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop;

export const expectAtBottom = async (canvasElement: HTMLElement) => {
	await expect(distanceFromBottom(getViewport(canvasElement))).toBeLessThanOrEqual(1);
};

const renderedMessages = (viewport: HTMLElement) => Array.from(viewport.querySelectorAll<HTMLElement>('[data-message-id]'));

/** The topmost message at least partly in view, and the offset of its top from the top of the viewport. */
export const firstVisibleMessage = (canvasElement: HTMLElement) => {
	const viewport = getViewport(canvasElement);
	const viewportTop = viewport.getBoundingClientRect().top;
	const row = renderedMessages(viewport).find((element) => element.getBoundingClientRect().bottom > viewportTop + 1);
	if (!row) {
		throw new Error('No message in view');
	}
	return { id: row.dataset.messageId, top: row.getBoundingClientRect().top - viewportTop };
};

export const messageRow = (canvasElement: HTMLElement, messageId: string) =>
	getViewport(canvasElement).querySelector<HTMLElement>(`[data-message-id="${messageId}"]`);

/** How far the center of a message row, with its dividers, is from the center of the viewport. */
export const offsetFromCenter = (canvasElement: HTMLElement, messageId: string) => {
	const viewport = getViewport(canvasElement);
	const row = messageRow(canvasElement, messageId);
	if (!row) {
		throw new Error(`Message ${messageId} is not rendered`);
	}
	const viewportRect = viewport.getBoundingClientRect();
	const rowRect = row.getBoundingClientRect();
	return rowRect.top + rowRect.height / 2 - (viewportRect.top + viewportRect.height / 2);
};

/** Scrolls as the viewer does: a wheel gesture, then the position it leads to. */
export const userScrollTo = async (canvasElement: HTMLElement, scrollTop: number) => {
	const viewport = getViewport(canvasElement);
	viewport.dispatchEvent(new WheelEvent('wheel', { deltaY: scrollTop - viewport.scrollTop, bubbles: true }));
	viewport.scrollTop = scrollTop;
	await waitForListSettled(canvasElement);
};

export const userScrollBy = (canvasElement: HTMLElement, delta: number) =>
	userScrollTo(canvasElement, getViewport(canvasElement).scrollTop + delta);

export const waitFor = async (condition: () => boolean, timeout = SETTLE_TIMEOUT_MS) => {
	const startedAt = performance.now();
	while (!condition()) {
		if (performance.now() - startedAt > timeout) {
			throw new Error('Timed out waiting for the condition');
		}
		await nextFrame();
	}
};
