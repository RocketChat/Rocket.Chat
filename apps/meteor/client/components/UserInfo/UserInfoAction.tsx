import type { Icon } from '@rocket.chat/fuselage';
import { Button } from '@rocket.chat/fuselage';
import type { ReactElement, ComponentProps } from 'react';
import React from 'react';

type UserInfoActionProps = {
	icon: ComponentProps<typeof Icon>['name'];
} & ComponentProps<typeof Button>;

const UserInfoAction = ({ icon, label, ...props }: UserInfoActionProps): ReactElement => (
	<Button icon={icon} title={label} {...props} mi='x4'>
		{label}
	</Button>
);

export default UserInfoAction;
