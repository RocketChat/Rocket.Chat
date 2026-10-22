import { Box, Icon, StatusIcon } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

const ListItem = ({
	children,
	icon,
	iconColor,
	fontScale = 'c1',
}: {
	children: ReactNode;
	icon?: ComponentProps<typeof Icon>['name'];
	iconColor?: ComponentProps<typeof StatusIcon>['status'];
	fontScale?: ComponentProps<typeof Box>['fontScale'];
}) => (
	<Box display='flex' is='li' fontScale={fontScale} gap={icon ? 4 : undefined}>
		{icon && (iconColor ? <StatusIcon name={icon} status={iconColor} size='x16' /> : <Icon name={icon} size='x16' />)}
		{children}
	</Box>
);

export default ListItem;
