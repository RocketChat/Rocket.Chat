import { useToggle } from '@rocket.chat/fuselage-hooks';
import { useAttachmentIsCollapsedByDefault } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

export const useCollapse = (attachmentCollapsed?: boolean) => {
	const collapseByDefault = useAttachmentIsCollapsedByDefault();
	const [collapsed, toggleCollapsed] = useToggle(collapseByDefault || attachmentCollapsed);
	return [collapsed, useCallback(() => toggleCollapsed(), [toggleCollapsed])] as const;
};
