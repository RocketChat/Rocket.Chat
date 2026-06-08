import { useAttachmentIsCollapsedByDefault } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';

import CollapsibleContent from '../content/collapsible/CollapsibleContent';

const SESSION_STORAGE_PREFIX = 'rc_attachment_collapsed_';

export const useCollapse = (attachmentCollapsed?: boolean, storageKey?: string): [collapsed: boolean, node: ReactNode] => {
	const collpaseByDefault = useAttachmentIsCollapsedByDefault();

	const getInitialCollapsed = (): boolean => {
		if (storageKey) {
			try {
				const stored = sessionStorage.getItem(SESSION_STORAGE_PREFIX + storageKey);
				if (stored !== null) {
					return stored === 'true';
				}
			} catch {
				// sessionStorage unavailable (private browsing, sandboxed iframe, quota exceeded)
			}
		}
		return !!(collpaseByDefault || attachmentCollapsed);
	};

	const [collapsed, setCollapsed] = useState<boolean>(getInitialCollapsed);

	const toggleCollapsed = useCallback(() => {
		setCollapsed((prev) => {
			const next = !prev;
			if (storageKey) {
				try {
					sessionStorage.setItem(SESSION_STORAGE_PREFIX + storageKey, String(next));
				} catch {
					// sessionStorage unavailable
				}
			}
			return next;
		});
	}, [storageKey]);

	return [collapsed, <CollapsibleContent collapsed={collapsed} onClick={toggleCollapsed} key='collapsible-content-action' />];
};
