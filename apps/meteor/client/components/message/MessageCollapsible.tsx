import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import AttachmentDownload from './content/attachments/structure/AttachmentDownload';
import AttachmentSize from './content/attachments/structure/AttachmentSize';
import CollapsibleContent from './content/collapsible/CollapsibleContent';
import { useCollapse } from './hooks/useCollapse';

type MessageCollapsibleProps = {
	children?: ReactNode;
	title?: string;
	hasDownload?: boolean;
	link?: string;
	size?: number;
	isCollapsed?: boolean;
};

const MessageCollapsible = ({ children, title, hasDownload, link, size, isCollapsed }: MessageCollapsibleProps) => {
	const [collapsed, toggleCollapse] = useCollapse(isCollapsed);

	return (
		<>
			<Box display='flex' flexDirection='row' color='hint' fontScale='c1' alignItems='center'>
				<Box withTruncatedText title={title}>
					{title}
				</Box>
				{size && <AttachmentSize size={size} />}{' '}
				<CollapsibleContent key='collapsible-content-action' collapsed={collapsed} onClick={toggleCollapse} />
				{hasDownload && link && <AttachmentDownload title={title} href={link} />}
			</Box>
			{!collapsed && children}
		</>
	);
};

export default MessageCollapsible;
