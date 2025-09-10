import { NavBarItem } from '@rocket.chat/fuselage';
import { useMediaCallAction } from '@rocket.chat/ui-voip';
import type { HTMLAttributes } from 'react';

type NavBarItemVoipDialerProps = Omit<HTMLAttributes<HTMLElement>, 'is'> & {
	primary?: boolean;
};

const NavBarItemVoipDialer = (props: NavBarItemVoipDialerProps) => {
	const { action, title, icon } = useMediaCallAction();

	return <NavBarItem {...props} title={title} icon={icon} onClick={() => action()} />;
};

export default NavBarItemVoipDialer;
