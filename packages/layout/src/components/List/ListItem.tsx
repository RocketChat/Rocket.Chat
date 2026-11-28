import { Box, Icon } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

const iconColors = {
	hint: 'hint',
	info: 'info',
	danger: 'danger',
	warning: 'status-font-on-warning',
	success: 'status-font-on-success',
} as const;

const ListItem = ({
	children,
	icon,
	iconColor,
	fontScale = 'c1',
}: {
	children: ReactNode;
	icon?: ComponentProps<typeof Icon>['name'];
	iconColor?: keyof typeof iconColors;
	fontScale?: ComponentProps<typeof Box>['fontScale'];
}) => (
	<Box display='flex' is='li' fontScale={fontScale} gap={icon ? 4 : undefined}>
		{icon && <Icon name={icon} color={iconColor && iconColors[iconColor]} size='x16' />}
		{children}
	</Box>
);

export default ListItem;
