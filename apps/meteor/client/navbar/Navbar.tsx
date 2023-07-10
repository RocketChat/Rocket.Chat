import { Box } from '@rocket.chat/fuselage';
import { useUser, useRole } from '@rocket.chat/ui-contexts';
import React from 'react';

import { Navbar as NavbarComponent } from '../components/Navbar';
import UserAvatarWithStatus from '../sidebar/header/UserAvatarWithStatus';
import UserMenu from '../sidebar/header/UserMenu';
import NavbarAdministrationAction from './actions/NavbarAdministrationAction';
import NavbarAuditAction from './actions/NavbarAuditAction';
import NavbarHomeAction from './actions/NavbarHomeAction';
import NavbarMarketplaceAction from './actions/NavbarMarketplaceAction';
import NavbarRegistrationAction from './actions/NavbarRegistrationAction';

const Navbar = () => {
	const user = useUser();
	const isAdmin = useRole('admin');

	return (
		<NavbarComponent>
			<Box is='li' mbe='x16' role='menuitem'>
				{user ? <UserMenu user={user} /> : <UserAvatarWithStatus />}
			</Box>
			<NavbarHomeAction />
			{/* <li role='menuitem'>
				<IconButton medium icon='team' aria-label='team' />
			</li>
			<li role='menuitem'>
				<IconButton title='Omnichannel' medium icon='headset' aria-label='omnichannel' />
			</li> */}
			<NavbarMarketplaceAction />
			{isAdmin && <NavbarRegistrationAction />}
			<NavbarAuditAction />
			<NavbarAdministrationAction />
		</NavbarComponent>
	);
};

export default Navbar;
