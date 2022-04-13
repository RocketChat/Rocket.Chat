import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useLayout, useSession } from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement } from 'react';

import { useEmbeddedLayout } from '../../hooks/useEmbeddedLayout';
import BurgerMenuButton from './BurgerMenuButton';

const BurgerMenu = (): ReactElement => {
	const { sidebar } = useLayout();
	const isLayoutEmbedded = useEmbeddedLayout();
	const unreadMessagesBadge = useSession('unread');

	const isSidebarOpen = sidebar.isOpen();
	const toggleSidebar = useMutableCallback(() => sidebar.toggle());

	return (
		<BurgerMenuButton
			open={isSidebarOpen}
			onClick={toggleSidebar}
			badge={!isLayoutEmbedded && unreadMessagesBadge && unreadMessagesBadge}
		/>
	);
};

export default memo(BurgerMenu);
