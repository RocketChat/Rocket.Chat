import { Box, Icon } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

type IconLabelProps = {
	icon?: ComponentProps<typeof Icon>['name'];
	color?: 'font-default' | 'status-font-on-warning' | 'status-font-on-danger';
	children: ReactNode;
};

/**
 * A label with its icon in front, both in the label's colour, such as an app status tag's or an app menu option's.
 */
const IconLabel = ({ icon, color, children }: IconLabelProps) => (
	<Box is='span' display='flex' alignItems='center' gap='x4' color={color}>
		{icon && <Icon name={icon} size='x16' />}
		{children}
	</Box>
);

export default IconLabel;
