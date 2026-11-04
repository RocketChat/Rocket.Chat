import { Box, SidebarItem } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { memo } from 'react';

export type SidebarGenericItemProps = {
	href?: string;
	active?: boolean;
	children: ReactNode;
	externalUrl?: boolean;
};

const SidebarGenericItem = ({ href, active, externalUrl, children, ...props }: SidebarGenericItemProps) => (
	<SidebarItem selected={active} is='a' href={href} {...(externalUrl && { target: '_blank', rel: 'noopener noreferrer' })} {...props}>
			{children}
	</SidebarItem>
);

export default memo(SidebarGenericItem);
