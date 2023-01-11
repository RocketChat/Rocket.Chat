import { Box } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';

import AttachmentDownload from './content/attachments/structure/AttachmentDownload';
import AttachmentSize from './content/attachments/structure/AttachmentSize';
import { useCollapse } from './hooks/useCollapse';

type MessageCollapsibleProps = { children?: ReactNode; title?: string; hasDownload?: boolean; link?: string; size?: number };

const MessageCollapsible = ({ children, title, hasDownload, link, size }: MessageCollapsibleProps): ReactElement => {
	const [collapsed, collapse] = useCollapse(false);

	return (
		<>
			<Box display='flex' flexDirection='row' color='hint' fontScale='c1' alignItems='center'>
				<Box withTruncatedText title={title}>
					{title}
				</Box>
				{size && <AttachmentSize size={size} />} {collapse}
				{hasDownload && link && <AttachmentDownload title={title} href={link} />}
			</Box>
			{!collapsed && children}
		</>
	);
};

export default MessageCollapsible;
