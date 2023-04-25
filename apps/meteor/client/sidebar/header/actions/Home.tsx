import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useLayout, useRoute, useSetting } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes, VFC } from 'react';
import React from 'react';

const SidebarHeaderActionHome: VFC<Omit<HTMLAttributes<HTMLElement>, 'is'>> = (props) => {
	const homeRoute = useRoute('home');
	const { sidebar } = useLayout();
	const showHome = useSetting('Layout_Show_Home_Button');
	const handleHome = useMutableCallback(() => {
		sidebar.toggle();
		homeRoute.push({});
	});

	return showHome ? <Sidebar.TopBar.Action {...props} icon='home' onClick={handleHome} /> : null;
};

export default SidebarHeaderActionHome;
