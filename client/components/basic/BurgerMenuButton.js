import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import './BurgerMenuButton.css';
import { useSession } from '../../contexts/SessionContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useEmbeddedLayout } from '../../hooks/useEmbeddedLayout';

export const BurgerMenuButton = (props) => {
	const [isSidebarOpen, setSidebarOpen] = useSidebar();
	const isLayoutEmbedded = useEmbeddedLayout();
	const unreadMessagesBadge = useSession('unread');

	const handleClick = () => {
		setSidebarOpen(!isSidebarOpen);
	};

	return <Box
		is='button'
		aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
		className={[
			'rc-old',
			'burger',
			!!isSidebarOpen && 'menu-opened',
		].filter(Boolean).join(' ')}
		type='button'
		onClick={handleClick}
		{...props}
	>
		<Box is='i' className='burger__line' aria-hidden='true' />
		<Box is='i' className='burger__line' aria-hidden='true' />
		<Box is='i' className='burger__line' aria-hidden='true' />
		{!isLayoutEmbedded && unreadMessagesBadge
		&& <Box className='unread-burger-alert color-error-contrast background-error-color'>
			{unreadMessagesBadge}
		</Box>}
	</Box>;
};
