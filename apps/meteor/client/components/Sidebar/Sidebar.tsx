import { Sidebar as FuselageSidebar } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

const Sidebar: FC = ({ children, ...props }) => (
	<FuselageSidebar {...props} role='navigation' display='flex' flexDirection='column' h='full' children={children} />
);

export default Sidebar;
