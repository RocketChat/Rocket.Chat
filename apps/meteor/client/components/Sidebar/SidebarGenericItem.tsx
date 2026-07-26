import { Box, SidebarV2Item } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { memo } from 'react';

export type SidebarGenericItemProps = {
	href?: string;
	active?: boolean;
	children: ReactNode;
	externalUrl?: boolean;
};

const SidebarGenericItem = ({ href, active, externalUrl, children, ...props }: SidebarGenericItemProps) => (
	<SidebarV2Item selected={active} is='a' href={href} {...(externalUrl && { target: '_blank', rel: 'noopener noreferrer' })} {...props}>
		<Box display='flex' flexDirection='row' alignItems='center' paddingBlock={8} width='100%'>
			{children}
		</Box>
	</SidebarV2Item>
);

export default memo(SidebarGenericItem);
