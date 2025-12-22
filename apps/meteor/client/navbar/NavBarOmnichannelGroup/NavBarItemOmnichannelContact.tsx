import { NavBarItem } from '@rocket.chat/fuselage';
import type { HTMLAttributes } from 'react';

import { useOmnichannelContactAction } from './hooks/useOmnichannelContactAction';

type NavBarItemOmnichannelContactProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarItemOmnichannelContact = (props: NavBarItemOmnichannelContactProps) => {
	const { icon, isPressed, title, handleGoToContactCenter } = useOmnichannelContactAction();

	return <NavBarItem {...props} icon={icon} title={title} onClick={handleGoToContactCenter} pressed={isPressed} />;
};

export default NavBarItemOmnichannelContact;
