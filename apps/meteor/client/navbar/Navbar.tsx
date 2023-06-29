import { IconButton } from '@rocket.chat/fuselage';
import React from 'react';

import NavbarComponent from '../components/Navbar/Navbar';
// import UserAvatarButton from './UserAvatarButton';
import NavbarHomeAction from './actions/NavbarHomeAction';
import NavbarMarketplaceAction from './actions/NavbarMarketplaceAction';

const Navbar = () => {
	const isOmnichannelEnabled = false;

	return (
		<NavbarComponent>
			{/* <Box is='li' mbe='x16' role='menuitem'>
				<UserAvatarButton />
			</Box> */}
			<NavbarHomeAction />
			{/* <li role='menuitem'>
				<IconButton medium icon='home' aria-label='home' />
			</li> */}
			<li role='menuitem'>
				<IconButton medium icon='team' aria-label='team' />
			</li>
			<li role='menuitem'>
				<IconButton title='Omnichannel' disabled={!isOmnichannelEnabled} medium icon='headset' aria-label='omnichannel' />
			</li>
			<NavbarMarketplaceAction />
			<li role='menuitem'>
				<IconButton title='Registration' medium icon='cloud-plus' aria-label='cloud' />
			</li>
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
