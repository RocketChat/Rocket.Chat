import { Box, Item } from '@rocket.chat/fuselage';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { memo } from 'react';

export type SidebarGenericItemProps = {
	href?: string;
	active?: boolean;
	children: ReactNode;
	externalUrl?: boolean;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children' | 'is'>;

const SidebarGenericItem = ({ href, active, externalUrl, children, ...props }: SidebarGenericItemProps) => (
	<Item is='a' selected={active} href={href} {...(externalUrl && { target: '_blank', rel: 'noopener noreferrer' })} {...props}>
		<Box display='flex' flexDirection='row' alignItems='center' paddingBlock={8} width='100%'>
			{children}
		</Box>
	</Item>
);

export default memo(SidebarGenericItem);
