import { Button, IconButton } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactElement, ComponentProps } from 'react';

type UserInfoActionProps = {
	icon: IconName;
} & ComponentProps<typeof Button>;

const UserInfoAction = ({ icon, label, title, ...props }: UserInfoActionProps): ReactElement => {
	if (!label && icon && title) {
		return <IconButton small secondary icon={icon} title={title} aria-label={title} {...props} mi={4} size={40} />;
	}

	return (
		<Button icon={icon} {...props} mi={4}>
			{label}
		</Button>
	);
};

export default UserInfoAction;
