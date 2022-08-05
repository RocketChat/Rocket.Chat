import { Button, Icon } from '@rocket.chat/fuselage';
import React, { ReactElement, ComponentProps } from 'react';

type UserInfoActionProps = {
	icon: ComponentProps<typeof Icon>['name'];
} & ComponentProps<typeof Button>;

const UserInfoAction = ({ icon, label, ...props }: UserInfoActionProps): ReactElement => (
	<Button title={label} {...props} mi='x4'>
		<Icon name={icon} size='x20' mie='x4' />
		{label}
	</Button>
);

export default UserInfoAction;
