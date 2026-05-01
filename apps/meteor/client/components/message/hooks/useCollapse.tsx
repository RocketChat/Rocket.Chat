import { useToggle } from '@rocket.chat/fuselage-hooks';
import { useAttachmentIsCollapsedByDefault } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import CollapsibleContent from '../content/collapsible/CollapsibleContent';

/**
 * Custom hook to persist collapse state in sessionStorage
 */
const usePersistedCollapse = (attachmentId: string | undefined, initialCollapsed: boolean) => {
	const [collapsed, setCollapsed] = useState(() => {
		// Try to restore from sessionStorage if attachmentId is available
		if (attachmentId) {
			const stored = sessionStorage.getItem(`attachment-collapsed-${attachmentId}`);
			if (stored !== null) {
				return stored === 'true';
			}
		}
		return initialCollapsed;
	});

	const toggleCollapsed = () => {
		setCollapsed((prev) => {
			const newValue = !prev;
			// Persist to sessionStorage
			if (attachmentId) {
				sessionStorage.setItem(`attachment-collapsed-${attachmentId}`, newValue ? 'true' : 'false');
			}
			return newValue;
		});
	};

	// Sync state when attachmentId changes
	useEffect(() => {
		if (attachmentId) {
			const stored = sessionStorage.getItem(`attachment-collapsed-${attachmentId}`);
			if (stored !== null) {
				setCollapsed(stored === 'true');
			}
		}
	}, [attachmentId]);

	return [collapsed, toggleCollapsed] as const;
};

export const useCollapse = (attachmentId?: string, attachmentCollapsed?: boolean): [collapsed: boolean, node: ReactNode] => {
	const collpaseByDefault = useAttachmentIsCollapsedByDefault();
	const initialCollapsed = collpaseByDefault || attachmentCollapsed;

	// Use persisted collapse if attachmentId is provided, otherwise use regular toggle
	const [collapsed, toggleCollapsed] = usePersistedCollapse(attachmentId, initialCollapsed);

	return [collapsed, <CollapsibleContent collapsed={collapsed} onClick={toggleCollapsed as any} key='collapsible-content-action' />];
};
