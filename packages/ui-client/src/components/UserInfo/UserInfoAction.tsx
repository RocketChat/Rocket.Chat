import { Button, Icon, IconButton } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ComponentProps } from 'react';

export type UserInfoActionProps = {
	icon: IconName;
} & Omit<ComponentProps<typeof Button>, 'color'>;

const UserInfoAction = ({ icon, label, title, ...props }: UserInfoActionProps) => {
	if (!label && icon && title) {
		return <IconButton large secondary icon={<Icon name={icon} size='x20' />} title={title} aria-label={title} {...props} />;
	}

	return (
		<Button icon={icon} {...props}>
			{label}
		</Button>
	);
};

export default UserInfoAction;
