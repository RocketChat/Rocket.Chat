import type { CSSProperties } from 'react';

export const createBoxSizes = (
	style: CSSProperties,
): {
	borderBoxSize: ResizeObserverSize;
	contentBoxSize: ResizeObserverSize;
} => {
	const getSizeInPixels = (value: string | number | undefined): number =>
		(typeof value === 'string' && parseInt(value, 10)) || (typeof value === 'number' && value) || 0;

	const inlineSize = getSizeInPixels(style.inlineSize);
	const borderInlineStartWidth = getSizeInPixels(style.borderInlineStartWidth);
	const borderInlineEndWidth = getSizeInPixels(style.borderInlineEndWidth);
	const paddingInlineStart = getSizeInPixels(style.paddingInlineStart);
	const paddingInlineEnd = getSizeInPixels(style.paddingInlineEnd);
	const blockSize = getSizeInPixels(style.blockSize);
	const borderBlockStartWidth = getSizeInPixels(style.borderBlockStartWidth);
	const borderBlockEndWidth = getSizeInPixels(style.borderBlockEndWidth);
	const paddingBlockStart = getSizeInPixels(style.paddingBlockStart);
	const paddingBlockEnd = getSizeInPixels(style.paddingBlockEnd);

	const inlineExtra = borderInlineStartWidth + paddingInlineStart + paddingInlineEnd + borderInlineEndWidth;
	const blockExtra = borderBlockStartWidth + paddingBlockStart + paddingBlockEnd + borderBlockEndWidth;

	const borderBoxSize = Object.freeze({
		inlineSize: inlineSize + (style.boxSizing === 'border-box' ? 0 : inlineExtra),
		blockSize: blockSize + (style.boxSizing === 'border-box' ? 0 : blockExtra),
	});

	const contentBoxSize = Object.freeze({
		inlineSize: inlineSize - (style.boxSizing === 'border-box' ? 0 : inlineExtra),
		blockSize: blockSize - (style.boxSizing === 'border-box' ? 0 : blockExtra),
	});

	return {
		borderBoxSize,
		contentBoxSize,
	};
};

export class ResizeObserverMock implements ResizeObserver {
	callback: ResizeObserverCallback = () => undefined;

	contentRect: DOMRectReadOnly = {
		bottom: 0,
		left: 0,
		right: 0,
		top: 0,
		x: 0,
		y: 0,
		width: 0,
		height: 0,
		toJSON: () => this.contentRect,
	};

	mutationObservers: Map<Element, MutationObserver> = new Map();

	constructor(callback: ResizeObserverCallback) {
		this.callback = callback;
	}

	disconnect = jest.fn((): void => {
		this.callback = () => undefined;
	});

	observe = jest.fn((target: Element) => {
		const mutationObserver = new MutationObserver((mutations: MutationRecord[]) => {
			for (const mutation of mutations) {
				if (!(mutation.target instanceof Element)) {
					return;
				}

				const styles = getComputedStyle(mutation.target);

				const { borderBoxSize, contentBoxSize } = createBoxSizes({
					boxSizing: styles.boxSizing === 'border-box' ? 'border-box' : 'content-box',
					inlineSize: styles.inlineSize,
					borderInlineStartWidth: styles.borderInlineStartWidth ? parseInt(styles.borderInlineStartWidth, 10) : 0,
					borderInlineEndWidth: styles.borderInlineEndWidth ? parseInt(styles.borderInlineEndWidth, 10) : 0,
					paddingInlineStart: styles.paddingInlineStart ? parseInt(styles.paddingInlineStart, 10) : 0,
					paddingInlineEnd: styles.paddingInlineEnd ? parseInt(styles.paddingInlineEnd, 10) : 0,
					blockSize: styles.blockSize ? parseInt(styles.blockSize, 10) : 0,
					borderBlockStartWidth: styles.borderBlockStartWidth ? parseInt(styles.borderBlockStartWidth, 10) : 0,
					borderBlockEndWidth: styles.borderBlockEndWidth ? parseInt(styles.borderBlockEndWidth, 10) : 0,
					paddingBlockStart: styles.paddingBlockStart ? parseInt(styles.paddingBlockStart, 10) : 0,
					paddingBlockEnd: styles.paddingBlockEnd ? parseInt(styles.paddingBlockEnd, 10) : 0,
				});

				this.callback(
					[
						{
							target,
							contentRect: this.contentRect,
							borderBoxSize: [borderBoxSize],
							contentBoxSize: [contentBoxSize],
							devicePixelContentBoxSize: [],
						},
					],
					this,
				);
			}
		});

		mutationObserver.observe(target, {
			attributes: true,
			attributeFilter: ['style'],
		});

		this.mutationObservers.set(target, mutationObserver);
		const t = target as HTMLElement;
		t.style.inlineSize = `${t.style.inlineSize};`;
	});

	unobserve = jest.fn((target: Element) => {
		this.mutationObservers.get(target)?.disconnect();
		this.mutationObservers.delete(target);
	});
}

export default ResizeObserverMock;
