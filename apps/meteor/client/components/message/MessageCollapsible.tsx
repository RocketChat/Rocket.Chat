import { Box } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';

import AttachmentDownload from './content/attachments/structure/AttachmentDownload';
import AttachmentSize from './content/attachments/structure/AttachmentSize';
import { useCollapse } from './hooks/useCollapse';


type MessageCollapsibleProps = {
	children?: ReactNode;
	title?: string;
	hasDownload?: boolean;
	link?: string;
	size?: number;
	// initial collapsed state coming from the attachment payload
	isCollapsed?: boolean;
	// optional storage id to persist per-item collapsed state (e.g. attachment id)
	storageId?: string;
};

const MessageCollapsible = ({ children, title, hasDownload, link, size, isCollapsed, storageId }: MessageCollapsibleProps): ReactElement => {
	const [collapsed, collapse] = useCollapse(isCollapsed, storageId);

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
