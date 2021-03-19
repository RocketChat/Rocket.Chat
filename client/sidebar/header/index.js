import React from 'react';
import { Sidebar } from '@rocket.chat/fuselage';

import Home from './actions/Home';
import Search from './actions/Search';
import Directory from './actions/Directory';
import Sort from './actions/Sort';
import CreateRoom from './actions/CreateRoom';
import Login from './actions/Login';
import UserAvatarButton from './UserAvatarButton';
import { useUser } from '../../contexts/UserContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useSidebarPaletteColor } from '../hooks/useSidebarPaletteColor';

const HeaderWithData = () => {
	const user = useUser();
	const t = useTranslation();
	useSidebarPaletteColor();
	return <>
		<Sidebar.TopBar.Section className='sidebar--custom-colors'>
			<UserAvatarButton user={user}/>
			<Sidebar.TopBar.Actions>
				<Home title={t('Home')} />
				<Search title={t('Search')} data-qa='sidebar-search' />
				{user && <>
					<Directory title={t('Directory')} />
					<Sort title={t('Filters')} />
					<CreateRoom title={t('Create_A_New_Channel')} data-qa='sidebar-create' />
				</>}
				{!user && <Login title={t('Login')} />}
			</Sidebar.TopBar.Actions>
		</Sidebar.TopBar.Section>
	</>;
};

export default React.memo(HeaderWithData);
