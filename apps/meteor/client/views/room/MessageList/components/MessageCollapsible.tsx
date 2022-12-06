import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement, ReactNode } from 'react';

import AttachmentDownload from '../../../../components/message/Attachments/Attachment/AttachmentDownload';
import AttachmentSize from '../../../../components/message/Attachments/Attachment/AttachmentSize';
import { useCollapse } from '../../../../components/message/Attachments/hooks/useCollapse';

type MessageCollapsibleProps = { children?: ReactNode; title?: string; hasDownload?: boolean; link?: string; size?: number };

const MessageCollapsible = ({ children, title, hasDownload, link, size }: MessageCollapsibleProps): ReactElement => {
	const [collapsed, collapse] = useCollapse(false);

	return (
		<>
			<Box display='flex' flexDirection='row' color='hint' fontScale='c1' alignItems='center'>
				{title} {size && <AttachmentSize size={size} />} {collapse}{' '}
				{hasDownload && link && <AttachmentDownload title={title} href={link} />}
			</Box>
			{!collapsed && children}
		</>
	);
};

export default MessageCollapsible;
