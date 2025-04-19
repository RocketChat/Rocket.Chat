import { NavBarItem } from '@rocket.chat/fuselage';
import type { HTMLAttributes } from 'react';

import { useOmnichannelQueueAction } from './hooks/useOmnichannelQueueAction';

type NavBarItemOmnichannelQueueProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarItemOmnichannelQueue = (props: NavBarItemOmnichannelQueueProps) => {
	const { isEnabled, title, icon, isPressed, handleGoToQueue } = useOmnichannelQueueAction();

	if (!isEnabled) {
		return null;
	}

	return <NavBarItem {...props} icon={icon} title={title} onClick={handleGoToQueue} pressed={isPressed} />;
};

export default NavBarItemOmnichannelQueue;
