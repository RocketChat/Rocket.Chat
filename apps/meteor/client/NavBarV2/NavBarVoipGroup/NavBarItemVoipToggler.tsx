import { NavBarItem } from '@rocket.chat/fuselage';
import type { HTMLAttributes } from 'react';

import { useVoipTogglerAction } from './hooks/useVoipTogglerAction';

type NavBarItemVoipDialerProps = Omit<HTMLAttributes<HTMLElement>, 'is'> & {
	primary?: boolean;
};

const NavBarItemVoipToggler = (props: NavBarItemVoipDialerProps) => {
	const { isEnabled, title, icon, isDisabled, handleToggleVoip } = useVoipTogglerAction();

	return isEnabled ? <NavBarItem {...props} title={title} icon={icon} disabled={isDisabled} onClick={handleToggleVoip} /> : null;
};

export default NavBarItemVoipToggler;
