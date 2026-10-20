import type { RefObject } from 'react';
import { useEffect } from 'react';

function getAncestors(element: Element): Element[] {
	const ancestors: Element[] = [];
	for (let el = element.parentElement; !!el && el !== document.documentElement; el = el.parentElement) {
		ancestors.push(el);
	}
	return ancestors;
}

export function useBoundingClientRectChanges(ref: RefObject<Element | null>, callback: () => void): void {
	useEffect(() => {
		const element = ref.current;

		if (!element) {
			return;
		}

		const safeCallback = () => {
			if (!ref.current) {
				return;
			}

			callback();
		};

		safeCallback();

		const observer = new ResizeObserver(safeCallback);
		observer.observe(element);

		window.addEventListener('resize', safeCallback);

		const ancestors = getAncestors(element);
		ancestors.forEach((ancestor) => ancestor.addEventListener('scroll', safeCallback, { passive: true }));

		return () => {
			observer.disconnect();
			window.removeEventListener('resize', safeCallback);
			ancestors.forEach((ancestor) => ancestor.removeEventListener('scroll', safeCallback));
		};
	}, [callback, ref]);
}
