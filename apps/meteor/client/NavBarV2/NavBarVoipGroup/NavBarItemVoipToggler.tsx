import { NavBarItem } from '@rocket.chat/fuselage';
import type { HTMLAttributes } from 'react';

import { useVoipTogglerAction } from './hooks/useVoipTogglerAction';

type NavBarItemVoipDialerProps = Omit<HTMLAttributes<HTMLElement>, 'is'> & {
	primary?: boolean;
};

const NavBarItemVoipToggler = (props: NavBarItemVoipDialerProps) => {
	const { title, icon, isDisabled, handleToggleVoip } = useVoipTogglerAction();

	return <NavBarItem {...props} title={title} icon={icon} disabled={isDisabled} onClick={handleToggleVoip} />;
};

export default NavBarItemVoipToggler;
