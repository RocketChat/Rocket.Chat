import { Emitter } from '@rocket.chat/emitter';
import { useCallback, useEffect, useSyncExternalStore } from 'react';

const ee = new Emitter<{
	change: void;
}>();

const titles = new Set<{
	title?: string;
	refocus?: boolean;
}>();

const useReactiveDocumentTitle = (): string =>
	useSyncExternalStore(
		useCallback((callback: () => void) => ee.on('change', callback), []),
		(): string =>
			Array.from(titles)
				.reverse()
				.map(({ title }) => title)
				.join(' - '),
	);

const useReactiveDocumentTitleKey = (): string =>
	useSyncExternalStore(
		useCallback((callback: () => void) => ee.on('change', callback), []),
		(): string =>
			Array.from(titles)
				.filter(({ refocus }) => refocus)
				.map(({ title }) => title)
				.join(' - '),
	);

export const useDocumentTitle = (documentTitle?: string, refocus = true) => {
	useEffect(() => {
		const titleObj = {
			title: documentTitle,
			refocus,
		};

		if (titleObj.title) {
			titles.add(titleObj);
		}

		ee.emit('change');

		return () => {
			titles.delete(titleObj);
			ee.emit('change');
		};
	}, [documentTitle, refocus]);

	return { title: useReactiveDocumentTitle(), key: useReactiveDocumentTitleKey() };
};
