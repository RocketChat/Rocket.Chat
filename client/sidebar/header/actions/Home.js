import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import { useLayout } from '../../../contexts/LayoutContext';
import { useRoute } from '../../../contexts/RouterContext';
import { useSetting } from '../../../contexts/SettingsContext';

const Home = (props) => {
	const homeRoute = useRoute('home');
	const { sidebar } = useLayout();
	const showHome = useSetting('Layout_Show_Home_Button');
	const handleHome = useMutableCallback(() => {
		sidebar.toggle();
		homeRoute.push({});
	});

	return showHome ? <Sidebar.TopBar.Action {...props} icon='home' onClick={handleHome} /> : null;
};

export default Home;
