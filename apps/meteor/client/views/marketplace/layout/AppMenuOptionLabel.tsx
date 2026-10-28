import { Box, Icon } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

type AppMenuOptionLabelProps = {
	icon?: ComponentProps<typeof Icon>['name'];
	color?: 'status-font-on-warning' | 'status-font-on-danger';
	children: ReactNode;
};

/**
 * The label of an app menu option, with its icon in front.
 */
const AppMenuOptionLabel = ({ icon, color, children }: AppMenuOptionLabelProps) => (
	<Box display='flex' alignItems='center' gap='x4' color={color}>
		{icon && <Icon name={icon} size='x16' />}
		{children}
	</Box>
);

export default AppMenuOptionLabel;
