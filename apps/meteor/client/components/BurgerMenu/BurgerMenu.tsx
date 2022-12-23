import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useLayout, useSession } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import { useEmbeddedLayout } from '../../hooks/useEmbeddedLayout';
import BurgerMenuButton from './BurgerMenuButton';

const BurgerMenu = (): ReactElement => {
	const { sidebar } = useLayout();
	const isLayoutEmbedded = useEmbeddedLayout();
	const unreadMessagesBadge = useSession('unread');

	const toggleSidebar = useMutableCallback(() => sidebar.toggle());

	return <BurgerMenuButton onClick={toggleSidebar} badge={!isLayoutEmbedded && unreadMessagesBadge && unreadMessagesBadge} />;
};

export default memo(BurgerMenu);
