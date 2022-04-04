import { useToggle } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import Attachment from '../Attachment';
import { useAttachmentIsCollapsedByDefault } from '../context/AttachmentContext';

export const useCollapse = (attachmentCollapsed: boolean): [boolean, JSX.Element] => {
	const collpaseByDefault = useAttachmentIsCollapsedByDefault();
	const [collapsed, toogleCollapsed] = useToggle(collpaseByDefault || attachmentCollapsed);
	return [collapsed, <Attachment.Collapse collapsed={collapsed} onClick={toogleCollapsed as any} />];
};
