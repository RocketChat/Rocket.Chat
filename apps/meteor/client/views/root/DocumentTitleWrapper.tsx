import { css } from '@rocket.chat/css-in-js';
import { Emitter } from '@rocket.chat/emitter';
import { Box } from '@rocket.chat/fuselage';
import { useSession, useSetting } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

const ee = new Emitter<{
	change: void;
}>();

const titles = new Set<{
	title: string;
	refocus?: boolean;
}>();

export const useDocumentTitle = (documentTitle: string, refocus?: boolean) => {
	useEffect(() => {
		const title = {
			title: documentTitle,
			refocus,
		};
		titles.add(title);

		ee.emit('change');

		return () => {
			titles.delete(title);
			ee.emit('change');
		};
	}, [documentTitle, refocus]);
};

const useReactiveDocumentTitle = (): string => {
	return useSyncExternalStore(
		useCallback((callback) => ee.on('change', callback), []),
		(): string =>
			Array.from(titles)
				.map(({ title }) => title)
				.join(' - '),
	);
};

const useReactiveDocumentTitleKey = (): string => {
	return useSyncExternalStore(
		useCallback((callback) => ee.on('change', callback), []),
		(): string =>
			Array.from(titles)
				.filter(({ refocus }) => refocus)
				.map(({ title }) => title)
				.join(' - '),
	);
};

const useRouteTitleFocus = () => {
	return useCallback((node: HTMLElement | null) => {
		if (!node) {
			return;
		}

		node.focus();
	}, []);
};

const useUnreadMessages = (): string => {
	const unreadMessages = useSession('unread');

	return (() => {
		if (unreadMessages === '') {
			return '';
		}

		return `${unreadMessages} unread messages`;
	})();
};

const DocumentTitleWrapper: FC = ({ children }) => {
	useDocumentTitle(useSetting<string>('Site_Name') || '');
	useDocumentTitle(useUnreadMessages());

	const title = useReactiveDocumentTitle();
	const key = useReactiveDocumentTitleKey();
	const refocusRef = useRouteTitleFocus();

	return (
		<>
			{createPortal(
				<Box
					tabIndex={-1}
					ref={refocusRef}
					key={key}
					className={css`
						position: absolute;
						width: 1px;
						height: 1px;
						padding: 0;
						margin: -1px;
						overflow: hidden;
						clip: rect(0, 0, 0, 0);
						white-space: nowrap;
						border-width: 0;
					`}
				>
					{title}
				</Box>,
				document.body,
			)}

			{children}
		</>
	);
};

export default DocumentTitleWrapper;
