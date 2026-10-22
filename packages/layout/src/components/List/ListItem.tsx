import { Box, Icon } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

const ListItem = ({
	children,
	icon,
	iconColor = 'success',
	fontScale = 'c1',
}: {
	children: ReactNode;
	icon?: ComponentProps<typeof Icon>['name'];
	iconColor?: ComponentProps<typeof Icon>['color'];
	fontScale?: ComponentProps<typeof Box>['fontScale'];
}) => (
	<Box display='flex' is='li' fontScale={fontScale} gap={icon ? 4 : undefined}>
		{icon && <Icon name={icon} color={iconColor} size='x16' />}
		{children}
	</Box>
);

export default ListItem;
