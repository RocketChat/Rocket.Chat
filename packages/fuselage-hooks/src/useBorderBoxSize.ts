import type { RefObject } from 'react';
import { useState } from 'react';

import { extractBorderBoxSizeFromObserver } from './extractSizeFromObserver';
import { useDebouncedCallback } from './useDebouncedCallback';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

export const useBorderBoxSize = (
	ref: RefObject<HTMLElement | null>,
	{
		debounceDelay = 0,
	}: {
		debounceDelay?: number;
	} = {},
): Readonly<{
	inlineSize: number;
	blockSize: number;
}> => {
	const [size, setSize] = useState(() => ({
		inlineSize: ref.current?.offsetWidth ?? 0,
		blockSize: ref.current?.offsetHeight ?? 0,
	}));

	const setSizeWithDebounce = useDebouncedCallback(setSize, debounceDelay);

	useIsomorphicLayoutEffect(() => {
		const element = ref.current;

		if (!element) {
			return;
		}

		const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
			if (entries.length === 0) {
				return;
			}

			const borderBoxSize = extractBorderBoxSizeFromObserver(entries[0]);

			setSizeWithDebounce((prevSize) => {
				if (prevSize.inlineSize === borderBoxSize.inlineSize && prevSize.blockSize === borderBoxSize.blockSize) {
					return prevSize;
				}

				return {
					inlineSize: borderBoxSize.inlineSize,
					blockSize: borderBoxSize.blockSize,
				};
			});
		});

		observer.observe(element);

		setSize({
			inlineSize: element.offsetWidth,
			blockSize: element.offsetHeight,
		});

		return () => {
			observer.unobserve(element);
		};
	}, [setSizeWithDebounce]);

	return size;
};
