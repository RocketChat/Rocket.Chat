import { useToggle } from '@rocket.chat/fuselage-hooks';
import { useAttachmentIsCollapsedByDefault } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';

import CollapsibleContent from '../content/collapsible/CollapsibleContent';

export const useCollapse = (attachmentCollapsed?: boolean): [collapsed: boolean, node: ReactNode] => {
	const collpaseByDefault = useAttachmentIsCollapsedByDefault();
	const [collapsed, toogleCollapsed] = useToggle(collpaseByDefault || attachmentCollapsed);
	return [collapsed, <CollapsibleContent collapsed={collapsed} onClick={toogleCollapsed as any} key='collapsible-content-action' />];
};
