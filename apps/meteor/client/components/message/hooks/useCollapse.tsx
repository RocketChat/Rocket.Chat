import { useToggle } from '@rocket.chat/fuselage-hooks';
import { useAttachmentIsCollapsedByDefault } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';

import CollapsibleContent from '../content/collapsible/CollapsibleContent';
import { isCollapsed as readCollapsed, setCollapsed as writeCollapsed } from '../../../lib/collapsedMediaStorage';

export const useCollapse = (attachmentCollapsed?: boolean, storageId?: string): [collapsed: boolean, node: ReactNode] => {
	const collpaseByDefault = useAttachmentIsCollapsedByDefault();

	// persisted value takes precedence when storageId is provided
	const persisted = storageId ? readCollapsed(String(storageId)) : undefined;
	const initial = typeof persisted === 'boolean' ? persisted : !!(collpaseByDefault || attachmentCollapsed);

	const [collapsed, toogleCollapsed] = useToggle(initial);

	const onToggle = () => {
		const next = !collapsed;
		if (storageId) {
			writeCollapsed(String(storageId), next);
		}
		toogleCollapsed();
	};

	return [collapsed, <CollapsibleContent collapsed={collapsed} onClick={onToggle as any} key='collapsible-content-action' />];
};
