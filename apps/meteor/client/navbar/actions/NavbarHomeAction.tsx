import { IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useCurrentRoute, useLayout, useRoute, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes, VFC } from 'react';
import React from 'react';

import NavbarAction from '../../components/Navbar/NavbarAction';

const NavbarHomeAction: VFC<Omit<HTMLAttributes<HTMLElement>, 'is'>> = (props) => {
	const t = useTranslation();
	const { sidebar } = useLayout();
	const homeRoute = useRoute('home');
	const [currentRoute] = useCurrentRoute();
	const showHome = useSetting('Layout_Show_Home_Button');

	const handleHome = useMutableCallback(() => {
		sidebar.toggle();
		homeRoute.push({});
	});

	return showHome ? (
		<NavbarAction {...props}>
			<IconButton pressed={currentRoute === 'home'} title={t('Home')} medium icon='home' onClick={handleHome} />
		</NavbarAction>
	) : null;
};

export default NavbarHomeAction;
