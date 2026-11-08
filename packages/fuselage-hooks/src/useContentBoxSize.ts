import type { RefObject } from 'react';
import { useState } from 'react';

import { extractContentBoxSizeFromObserver } from './extractSizeFromObserver';
import { useDebouncedCallback } from './useDebouncedCallback';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

export const useContentBoxSize = (
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
	const [size, setSize] = useState({
		inlineSize: ref.current?.clientWidth ?? 0,
		blockSize: ref.current?.clientHeight ?? 0,
	});

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

			const contentBoxSize = extractContentBoxSizeFromObserver(entries[0]);

			setSizeWithDebounce((prevSize) => {
				if (prevSize.inlineSize === contentBoxSize.inlineSize && prevSize.blockSize === contentBoxSize.blockSize) {
					return prevSize;
				}

				return {
					inlineSize: contentBoxSize.inlineSize,
					blockSize: contentBoxSize.blockSize,
				};
			});
		});

		observer.observe(element);

		setSize({
			inlineSize: element.clientWidth,
			blockSize: element.clientHeight,
		});

		return () => {
			observer.unobserve(element);
		};
	}, [setSizeWithDebounce]);

	return size;
};
