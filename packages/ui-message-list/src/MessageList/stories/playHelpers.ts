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

/**
 * How far the top of a message is from the top of the viewport: the message itself, below the dividers of its row, which come
 * and go as pages of the same day or another day arrive.
 */
const offsetOfMessage = (viewport: HTMLElement, row: HTMLElement) =>
	(row.lastElementChild ?? row).getBoundingClientRect().top - viewport.getBoundingClientRect().top;

/** The topmost message at least partly in view, and the offset of its top from the top of the viewport. */
export const firstVisibleMessage = (canvasElement: HTMLElement) => {
	const viewport = getViewport(canvasElement);
	const viewportTop = viewport.getBoundingClientRect().top;
	const row = renderedMessages(viewport).find((element) => element.getBoundingClientRect().bottom > viewportTop + 1);
	if (!row) {
		throw new Error('No message in view');
	}
	return { id: row.dataset.messageId as string, top: offsetOfMessage(viewport, row) };
};

export const messageRow = (canvasElement: HTMLElement, messageId: string) =>
	getViewport(canvasElement).querySelector<HTMLElement>(`[data-message-id="${messageId}"]`);

/** Where a message is now, measured as `firstVisibleMessage` measures it. */
export const messageOffset = (canvasElement: HTMLElement, messageId: string) => {
	const row = messageRow(canvasElement, messageId);
	if (!row) {
		throw new Error(`Message ${messageId} is not rendered`);
	}
	return offsetOfMessage(getViewport(canvasElement), row);
};

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

/**
 * Records what each frame shows once the rows are in sight: how far the list is from the bottom and the first message in
 * view. Each frame is read before it is painted and again right after, since the virtualizer corrects itself in between.
 */
export const recordShownFrames = (canvasElement: HTMLElement) => {
	const frames: { distanceFromBottom: number; firstMessage: ReturnType<typeof firstVisibleMessage> }[] = [];
	let isRecording = true;

	const record = () => {
		const viewport = canvasElement.querySelector<HTMLElement>('[role="list"]');
		const rows = viewport?.firstElementChild;
		if (!viewport || !rows || !viewport.querySelector('[data-message-id]') || getComputedStyle(rows).opacity === '0') {
			return;
		}
		frames.push({ distanceFromBottom: distanceFromBottom(viewport), firstMessage: firstVisibleMessage(canvasElement) });
	};
	const onFrame = () => {
		if (!isRecording) {
			return;
		}
		record();
		setTimeout(record);
		requestAnimationFrame(onFrame);
	};
	requestAnimationFrame(onFrame);

	return () => {
		isRecording = false;
		return frames;
	};
};

export const waitFor = async (condition: () => boolean, timeout = SETTLE_TIMEOUT_MS) => {
	const startedAt = performance.now();
	while (!condition()) {
		if (performance.now() - startedAt > timeout) {
			throw new Error(`Timed out waiting for: ${condition.toString()}`);
		}
		await nextFrame();
	}
};
