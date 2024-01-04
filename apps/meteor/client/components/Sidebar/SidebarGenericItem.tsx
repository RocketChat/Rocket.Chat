import { Box, SidebarItem } from '@rocket.chat/fuselage';
import type colors from '@rocket.chat/fuselage-tokens/colors';
import type { ReactElement, ReactNode } from 'react';
import React, { memo } from 'react';

type SidebarGenericItemProps = {
	href?: string;
	active?: boolean;
	featured?: boolean;
	children: ReactNode;
	customColors?: {
		default: (typeof colors)[string];
		hover: (typeof colors)[string];
		active: (typeof colors)[string];
	};
	externalUrl?: boolean;
};

const SidebarGenericItem = ({ href, active, externalUrl, children, ...props }: SidebarGenericItemProps): ReactElement => (
	<SidebarItem
		selected={active}
		clickable
		is='a'
		href={href}
		{...(externalUrl && { target: '_blank', rel: 'noopener noreferrer' })}
		{...props}
	>
		<Box display='flex' flexDirection='row' alignItems='center' pb={8} width='100%'>
			{children}
		</Box>
	</SidebarItem>
);

export default memo(SidebarGenericItem);
