import { Margins } from '@rocket.chat/fuselage';
import { useUser } from '@rocket.chat/ui-contexts';
import type { AllHTMLAttributes } from 'react';
import React from 'react';

import { NavbarAction } from '../../components/Navbar';
import UserAvatarWithStatusUnstable from '../../sidebar/header/UserAvatarWithStatusUnstable';
import UserMenu from '../../sidebar/header/UserMenu';

const NavbarUserAction = (props: AllHTMLAttributes<HTMLLIElement>) => {
	const user = useUser();

	return (
		<NavbarAction {...props}>
			<Margins blockEnd={16}>{user ? <UserMenu user={user} /> : <UserAvatarWithStatusUnstable />}</Margins>
		</NavbarAction>
	);
};

export default NavbarUserAction;
