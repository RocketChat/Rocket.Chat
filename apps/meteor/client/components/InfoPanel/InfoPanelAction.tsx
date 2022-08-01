import { Icon, Button } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

const InfoPanelAction: FC<ComponentProps<typeof Button> & { icon: ComponentProps<typeof Icon>['name']; label: string }> = ({
	label,
	icon,
	...props
}) => (
	<Button title={label} aria-label={label} {...props} mi='x4'>
		<Icon name={icon} size='x20' mie='x4' />
		{label}
	</Button>
);

export default InfoPanelAction;
