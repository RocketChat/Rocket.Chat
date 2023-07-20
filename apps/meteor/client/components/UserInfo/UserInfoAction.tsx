import { Button, Icon } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactElement, ComponentProps } from 'react';
import React from 'react';

type UserInfoActionProps = {
	icon: IconName;
} & ComponentProps<typeof Button>;

const UserInfoAction = ({ icon, label, ...props }: UserInfoActionProps): ReactElement => (
	<Button title={label} {...props} mi='x4'>
		<Icon name={icon} size='x20' mie='x4' />
		{label}
	</Button>
);

export default UserInfoAction;
