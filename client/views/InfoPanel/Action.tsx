import { Icon, Button } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

const Action: FC<ComponentProps<typeof Button> & { icon: string; label: string }> = ({
	label,
	icon,
	...props
}) => (
	<Button title={label} aria-label={label} {...props} mi='x4'>
		<Icon name={icon} size='x20' mie='x4' />
		{label}
	</Button>
);

export default Action;
