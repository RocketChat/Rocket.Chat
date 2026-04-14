import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useDocumentTitle } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useEffect, useCallback } from 'react';

import { useUnreadMessages } from './hooks/useUnreadMessages';

const useRouteTitleFocus = () => {
	return useCallback((node: HTMLElement | null) => {
		if (!node) {
			return;
		}

		// If the parent element has aria-hidden set to true, it means the element is not visible to screen readers.
		// This is a common practice to hide elements that are not currently in use or are not relevant to the user.
		// For example, a modal or popover might be open, and the main content is hidden to keep the user's focus on the modal.
		// Since the title is marked with `tabIndex={-1}`, it is not reachable by keyboard navigation.
		// https://accessibilityinsights.io/info-examples/web/aria-hidden-focus/
		if (node.parentElement?.ariaHidden !== 'true') {
			node.focus();
		}
	}, []);
};

type DocumentTitleWrapperProps = {
	children?: ReactNode;
};

const DocumentTitleWrapper = ({ children }: DocumentTitleWrapperProps) => {
	useDocumentTitle(useSetting('Site_Name', ''), false);
	const { title, key } = useDocumentTitle(useUnreadMessages(), false);

	const refocusRef = useRouteTitleFocus();

	useEffect(() => {
		document.title = title;
	}, [title]);

	return (
		<>
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
			</Box>
			{children}
		</>
	);
};

export default DocumentTitleWrapper;
