import { useToggle } from '@rocket.chat/fuselage-hooks';
import { useAttachmentIsCollapsedByDefault } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

export const useCollapse = (attachmentCollapsed?: boolean) => {
	const collpaseByDefault = useAttachmentIsCollapsedByDefault();
	const [collapsed, toogleCollapsed] = useToggle(collpaseByDefault || attachmentCollapsed);
	return [collapsed, useCallback(() => toogleCollapsed(), [toogleCollapsed])] as const;
};
