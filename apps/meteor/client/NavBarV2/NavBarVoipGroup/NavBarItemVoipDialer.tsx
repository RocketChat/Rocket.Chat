import { NavBarItem } from '@rocket.chat/fuselage';
import type { HTMLAttributes } from 'react';

import { useVoipDialerAction } from './hooks/useVoipDialerAction';

type NavBarItemVoipDialerProps = Omit<HTMLAttributes<HTMLElement>, 'is'> & {
	primary?: boolean;
};

const NavBarItemVoipDialer = (props: NavBarItemVoipDialerProps) => {
	const { isEnabled, title, handleToggleDialer, isPressed, isDisabled } = useVoipDialerAction();

	return isEnabled ? (
		<NavBarItem {...props} title={title} icon='dialpad' onClick={handleToggleDialer} pressed={isPressed} disabled={isDisabled} />
	) : null;
};

export default NavBarItemVoipDialer;
