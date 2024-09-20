import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useLayout, useSession } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import { useEmbeddedLayout } from '../../hooks/useEmbeddedLayout';
import SidebarTogglerButton from './SidebarTogglerButton';

const SideBarToggler = (): ReactElement => {
	const { sidebar } = useLayout();
	const isLayoutEmbedded = useEmbeddedLayout();
	const unreadMessagesBadge = useSession('unread');

	const toggleSidebar = useEffectEvent(() => sidebar.toggle());

	return <SidebarTogglerButton onClick={toggleSidebar} badge={!isLayoutEmbedded && unreadMessagesBadge && unreadMessagesBadge} />;
};

export default memo(SideBarToggler);
