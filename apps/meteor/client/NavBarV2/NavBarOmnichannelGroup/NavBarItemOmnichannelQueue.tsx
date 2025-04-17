import { NavBarItem } from '@rocket.chat/fuselage';
import type { HTMLAttributes } from 'react';

import { useOmnichannelQueueAction } from './hooks/useOmnichannelQueueAction';

type NavBarItemOmnichannelQueueProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarItemOmnichannelQueue = (props: NavBarItemOmnichannelQueueProps) => {
	const { isEnabled, title, icon, isPressed, handleGoToQueue } = useOmnichannelQueueAction();

	return isEnabled ? <NavBarItem {...props} icon={icon} title={title} onClick={handleGoToQueue} pressed={isPressed} /> : null;
};

export default NavBarItemOmnichannelQueue;
