import { Box, SidebarItem } from '@rocket.chat/fuselage';
import type colors from '@rocket.chat/fuselage-tokens/colors';
import React, { memo, ReactElement, ReactNode } from 'react';

type SidebarGenericItemProps = {
	href?: string;
	active?: boolean;
	featured?: boolean;
	children: ReactNode;
	customColors?: {
		default: typeof colors[string];
		hover: typeof colors[string];
		active: typeof colors[string];
	};
	textColor?: string;
};

const SidebarGenericItem = ({ href, active, children, ...props }: SidebarGenericItemProps): ReactElement => (
	<SidebarItem {...{ ...props, selected: active }} clickable is='a' href={href}>
		<Box display='flex' flexDirection='row' alignItems='center' pb='x8' pi='x12'>
			{children}
		</Box>
	</SidebarItem>
);

export default memo(SidebarGenericItem);
