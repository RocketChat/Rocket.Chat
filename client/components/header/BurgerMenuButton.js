import React from 'react';

import './BurgerMenuButton.css';
import { useSession } from '../../contexts/SessionContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useEmbeddedLayout } from '../../hooks/useEmbeddedLayout';

export const BurgerMenuButton = () => {
	const [isSidebarOpen, setSidebarOpen] = useSidebar();
	const isLayoutEmbedded = useEmbeddedLayout();
	const unreadMessagesBadge = useSession('unread');

	const handleClick = () => {
		setSidebarOpen(!isSidebarOpen);
	};

	return <button
		aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
		className={[
			'rc-old',
			'burger',
			!!isSidebarOpen && 'menu-opened',
		].filter(Boolean).join(' ')}
		type='button'
		onClick={handleClick}
	>
		<i className='burger__line' aria-hidden='true' />
		<i className='burger__line' aria-hidden='true' />
		<i className='burger__line' aria-hidden='true' />
		{!isLayoutEmbedded && unreadMessagesBadge
		&& <div className='unread-burger-alert color-error-contrast background-error-color'>
			{unreadMessagesBadge}
		</div>}
	</button>;
};
