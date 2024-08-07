import { Button, IconButton } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactElement, ComponentProps } from 'react';
import React from 'react';

type UserInfoActionProps = {
	icon: IconName;
	iconOnly?: boolean;
} & ComponentProps<typeof Button>;

const UserInfoAction = ({ icon, label, iconOnly = false, ...props }: UserInfoActionProps): ReactElement => {
	if (iconOnly) {
		return <IconButton small secondary icon={icon} title={label} {...props} mi={4} size={40} />;
	}

	return (
		<Button icon={icon} title={label} {...props} mi={4}>
			{label}
		</Button>
	);
};

export default UserInfoAction;
