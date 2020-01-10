import React from 'react';

import './BurgerMenuButton.css';

export const BurgerMenuButton = ({
	isSidebarOpen,
	isLayoutEmbedded,
	unreadMessagesBadge,
	onClick,
}) => <button
	aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
	className={[
		'rc-old',
		'burger',
		!!isSidebarOpen && 'menu-opened',
	].filter(Boolean).join(' ')}
	type='button'
	onClick={onClick}
>
	<i className='burger__line' aria-hidden='true' />
	<i className='burger__line' aria-hidden='true' />
	<i className='burger__line' aria-hidden='true' />
	{!isLayoutEmbedded && unreadMessagesBadge
		&& <div className='unread-burger-alert color-error-contrast background-error-color'>
			{unreadMessagesBadge}
		</div>}
</button>;
