import { useToggle } from '@rocket.chat/fuselage-hooks';
import { useAttachmentIsCollapsedByDefault } from '@rocket.chat/ui-contexts';
import React from 'react';

import AttachmentCollapse from '../Attachment/AttachmentCollapse';

export const useCollapse = (attachmentCollapsed: boolean): [boolean, JSX.Element] => {
	const collpaseByDefault = useAttachmentIsCollapsedByDefault();
	const [collapsed, toogleCollapsed] = useToggle(collpaseByDefault || attachmentCollapsed);
	return [collapsed, <AttachmentCollapse collapsed={collapsed} onClick={toogleCollapsed as any} />];
};
