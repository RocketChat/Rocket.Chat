import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { memo, ReactElement } from 'react';

import { useLayout } from '../../contexts/LayoutContext';
import { useSession } from '../../contexts/SessionContext';
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
