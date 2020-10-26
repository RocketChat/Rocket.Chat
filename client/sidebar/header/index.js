import React from 'react';
import { Sidebar } from '@rocket.chat/fuselage';

import Home from './actions/Home';
import Search from './actions/Search';
import Directory from './actions/Directory';
import Sort from './actions/Sort';
import CreateRoom from './actions/CreateRoom';
import Menu from './actions/Menu';
import Login from './actions/Login';
import UserAvatarButton from './UserAvatarButton';
import { useUser } from '../../contexts/UserContext';
import { useSidebarPaletteColor } from '../hooks/useSidebarPaletteColor';

const HeaderWithData = () => {
	const user = useUser();
	useSidebarPaletteColor();
	return <>
		<Sidebar.TopBar.Section className='sidebar--custom-colors'>
			<UserAvatarButton user={user}/>
			<Sidebar.TopBar.Actions>
				<Home />
				<Search data-qa='sidebar-search' />
				{user && <>
					<Directory />
					<Sort />
					<CreateRoom data-qa='sidebar-create' />
					<Menu />
				</>}
				{!user && <Login/>}
			</Sidebar.TopBar.Actions>
		</Sidebar.TopBar.Section>
	</>;
};

export default React.memo(HeaderWithData);
