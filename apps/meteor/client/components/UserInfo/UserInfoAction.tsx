import { Button, IconButton } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactElement, ComponentProps } from 'react';
import React, { useEffect, useState } from 'react';

type UserInfoActionProps = {
	icon: IconName;
} & ComponentProps<typeof Button>;

const UserInfoAction = ({ icon, label, title, ...props }: UserInfoActionProps): ReactElement => {
	const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false);
	useEffect(() => {
		if (window.innerWidth <= 480) setIsSmallScreen(true);
		else setIsSmallScreen(false);
	}, [window.innerWidth]);
	if (isSmallScreen) {
		return <IconButton small secondary icon={icon} title={label} aria-label={title} {...props} mi={4} size={40} />;
	}

	return (
		<Button icon={icon} {...props} mi={4}>
			{label}
		</Button>
	);
};

export default UserInfoAction;
