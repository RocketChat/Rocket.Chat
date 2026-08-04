import type { ButtonProps } from '@rocket.chat/fuselage';
import { Button, IconButton } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';

export type UserInfoActionProps = {
	icon: IconName;
} & ButtonProps;

const UserInfoAction = ({ icon, label, title, ...props }: UserInfoActionProps) => {
	if (!label && icon && title) {
		return <IconButton small secondary icon={icon} title={title} aria-label={title} {...props} marginInline={4} size={40} />;
	}

	return (
		<Button icon={icon} {...props} marginInline={4}>
			{label}
		</Button>
	);
};

export default UserInfoAction;
