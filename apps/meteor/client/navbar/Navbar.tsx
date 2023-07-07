import { IconButton, Box } from '@rocket.chat/fuselage';
import { useUser } from '@rocket.chat/ui-contexts';
import React from 'react';

import NavbarComponent from '../components/Navbar/Navbar';
// import UserAvatarButton from './UserAvatarButton';
import UserAvatarWithStatus from '../sidebar/header/UserAvatarWithStatus';
import UserMenu from '../sidebar/header/UserMenu';
import NavbarHomeAction from './actions/NavbarHomeAction';
import NavbarMarketplaceAction from './actions/NavbarMarketplaceAction';
import NavbarRegistrationAction from './actions/NavbarRegistrationAction';

const Navbar = () => {
	const user = useUser();

	return (
		<NavbarComponent>
			<Box is='li' mbe='x16' role='menuitem'>
				{user ? <UserMenu user={user} /> : <UserAvatarWithStatus />}
			</Box>
			<NavbarHomeAction />
			{/* <li role='menuitem'>
				<IconButton medium icon='home' aria-label='home' />
			</li> */}
			{/* <li role='menuitem'>
				<IconButton medium icon='team' aria-label='team' />
			</li> */}
			{/* <li role='menuitem'>
				<IconButton title='Omnichannel' disabled={!isOmnichannelEnabled} medium icon='headset' aria-label='omnichannel' />
			</li> */}
			<NavbarMarketplaceAction />
			<NavbarRegistrationAction />
			<li role='menuitem'>
				<IconButton title='Audit' medium icon='document-eye' aria-label='audit' />
			</li>
			<li role='menuitem'>
				<IconButton title='Settings' medium icon='cog' aria-label='settings' />
			</li>
		</NavbarComponent>
	);
};

export default Navbar;
