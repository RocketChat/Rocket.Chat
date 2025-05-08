import { NavBarItem } from '@rocket.chat/fuselage';
import type { HTMLAttributes } from 'react';

import { useVoipDialerAction } from './hooks/useVoipDialerAction';

type NavBarItemVoipDialerProps = Omit<HTMLAttributes<HTMLElement>, 'is'> & {
	primary?: boolean;
};

const NavBarItemVoipDialer = (props: NavBarItemVoipDialerProps) => {
	const { title, handleToggleDialer, isPressed, isDisabled } = useVoipDialerAction();

	return <NavBarItem {...props} title={title} icon='dialpad' onClick={handleToggleDialer} pressed={isPressed} disabled={isDisabled} />;
};

export default NavBarItemVoipDialer;
