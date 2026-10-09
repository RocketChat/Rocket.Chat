type NormalizedStyle = {
	boxSizing: 'border-box' | 'content-box';
	inlineSize: number;
	borderInlineStartWidth: number;
	borderInlineEndWidth: number;
	paddingInlineStart: number;
	paddingInlineEnd: number;
	blockSize: number;
	borderBlockStartWidth: number;
	borderBlockEndWidth: number;
	paddingBlockStart: number;
	paddingBlockEnd: number;
};

const getSizeInPixels = (value: unknown): number =>
	(typeof value === 'string' && parseInt(value, 10)) || (typeof value === 'number' && value) || 0;

const getNormalizedStyle = (style: CSSStyleDeclaration): NormalizedStyle => ({
	boxSizing: style.boxSizing === 'border-box' ? 'border-box' : 'content-box',
	inlineSize: getSizeInPixels(style.inlineSize || style.width),
	borderInlineStartWidth: getSizeInPixels(style.borderInlineStartWidth || style.borderRightWidth),
	borderInlineEndWidth: getSizeInPixels(style.borderInlineEndWidth || style.borderRightWidth),
	paddingInlineStart: getSizeInPixels(style.paddingInlineStart || style.paddingLeft),
	paddingInlineEnd: getSizeInPixels(style.paddingInlineEnd || style.paddingRight),
	blockSize: getSizeInPixels(style.blockSize || style.height),
	borderBlockStartWidth: getSizeInPixels(style.borderBlockStartWidth || style.borderTopWidth),
	borderBlockEndWidth: getSizeInPixels(style.borderBlockEndWidth || style.borderBottomWidth),
	paddingBlockStart: getSizeInPixels(style.paddingBlockStart || style.paddingTop),
	paddingBlockEnd: getSizeInPixels(style.paddingBlockEnd || style.paddingBottom),
});

const createBoxSizes = ({
	boxSizing,
	inlineSize,
	borderInlineStartWidth,
	borderInlineEndWidth,
	paddingInlineStart,
	paddingInlineEnd,
	blockSize,
	borderBlockStartWidth,
	borderBlockEndWidth,
	paddingBlockStart,
	paddingBlockEnd,
}: NormalizedStyle) => {
	if (boxSizing === 'border-box') {
		const borderBoxSize = Object.freeze({
			inlineSize,
			blockSize,
		});

		const contentBoxSize = Object.freeze({
			inlineSize: inlineSize - borderInlineStartWidth - paddingInlineStart - paddingInlineEnd - borderInlineEndWidth,
			blockSize: blockSize - borderBlockStartWidth - paddingBlockStart - paddingBlockEnd - borderBlockEndWidth,
		});

		return {
			borderBoxSize,
			contentBoxSize,
		};
	}

	const borderBoxSize = Object.freeze({
		inlineSize: borderInlineStartWidth + paddingInlineStart + inlineSize + paddingInlineEnd + borderInlineEndWidth,
		blockSize: borderBlockStartWidth + paddingBlockStart + blockSize + paddingBlockEnd + borderBlockEndWidth,
	});

	const contentBoxSize = Object.freeze({
		inlineSize,
		blockSize,
	});

	return {
		borderBoxSize,
		contentBoxSize,
	};
};

const sizeMock: PropertyDescriptorMap & ThisType<HTMLElement> = {
	offsetWidth: {
		get(this: HTMLElement) {
			const { boxSizing, inlineSize, borderInlineStartWidth, paddingInlineStart, paddingInlineEnd, borderInlineEndWidth } =
				getNormalizedStyle(getComputedStyle(this));

			if (boxSizing === 'border-box') {
				return inlineSize;
			}

			return borderInlineStartWidth + paddingInlineStart + inlineSize + paddingInlineEnd + borderInlineEndWidth;
		},
	},
	offsetHeight: {
		get(this: HTMLElement) {
			const { boxSizing, blockSize, borderBlockStartWidth, paddingBlockStart, paddingBlockEnd, borderBlockEndWidth } = getNormalizedStyle(
				getComputedStyle(this),
			);

			if (boxSizing === 'border-box') {
				return blockSize;
			}

			return borderBlockStartWidth + paddingBlockStart + blockSize + paddingBlockEnd + borderBlockEndWidth;
		},
	},
	clientWidth: {
		get(this: HTMLElement) {
			const { boxSizing, inlineSize, borderInlineStartWidth, paddingInlineStart, paddingInlineEnd, borderInlineEndWidth } =
				getNormalizedStyle(getComputedStyle(this));

			if (boxSizing === 'border-box') {
				return inlineSize - borderInlineStartWidth - paddingInlineStart - paddingInlineEnd - borderInlineEndWidth;
			}

			return inlineSize;
		},
	},
	clientHeight: {
		get(this: HTMLElement) {
			const { boxSizing, blockSize, borderBlockStartWidth, paddingBlockStart, paddingBlockEnd, borderBlockEndWidth } = getNormalizedStyle(
				getComputedStyle(this),
			);

			if (boxSizing === 'border-box') {
				return blockSize - borderBlockStartWidth - paddingBlockStart - paddingBlockEnd - borderBlockEndWidth;
			}

			return blockSize;
		},
	},
};

class ResizeObserverMock implements ResizeObserver {
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

	mutationObservers = new Map<Element, MutationObserver>();

	constructor(callback: ResizeObserverCallback) {
		this.callback = callback;
	}

	disconnect = jest.fn(() => {
		this.callback = () => undefined;
	});

	observe = jest.fn((target: Element) => {
		const mutationObserver = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (!(mutation.target instanceof Element)) {
					return;
				}

				const style = getNormalizedStyle(getComputedStyle(mutation.target));

				const { borderBoxSize, contentBoxSize } = createBoxSizes(style);

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
	});

	unobserve = jest.fn((target: Element) => {
		this.mutationObservers.get(target)?.disconnect();
		this.mutationObservers.delete(target);
	});
}

export const withResizeObserverMock = () => {
	beforeAll(() => {
		if (window.ResizeObserver === ResizeObserverMock) {
			return;
		}

		window.ResizeObserver = ResizeObserverMock;
		Object.defineProperties(window.HTMLElement.prototype, sizeMock);
	});
};
