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

		node.focus();
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
