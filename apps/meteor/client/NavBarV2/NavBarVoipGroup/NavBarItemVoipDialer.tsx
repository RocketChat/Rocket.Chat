import { NavBarItem } from '@rocket.chat/fuselage';
import type { HTMLAttributes } from 'react';

import { useMediaCallAction } from './hooks/useMediaCallAction';

type NavBarItemVoipDialerProps = Omit<HTMLAttributes<HTMLElement>, 'is'> & {
	primary?: boolean;
};

const NavBarItemVoipDialer = (props: NavBarItemVoipDialerProps) => {
	const { action, ...mediaCallAction } = useMediaCallAction();

	return <NavBarItem {...props} {...mediaCallAction} onClick={action} />;
};

export default NavBarItemVoipDialer;
