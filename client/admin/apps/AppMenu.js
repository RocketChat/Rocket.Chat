import React from 'react';
import { Menu } from '@rocket.chat/fuselage';

import { useMenuOptions } from './hooks/useMenuOptions';

export default function AppMenu({ app, setModal, isLoggedIn, ...props }) {
	const menuOptions = useMenuOptions({ app, setModal, isLoggedIn });

	return <Menu options={menuOptions} placement='bottom left' {...props}/>;
}
