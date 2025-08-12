import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useLayout, useSession } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { memo } from 'react';

import SidebarTogglerButton from './SidebarTogglerButton';
import { useEmbeddedLayout } from '../../hooks/useEmbeddedLayout';

const SideBarToggler = (): ReactElement => {
	const { sidebar } = useLayout();
	const isLayoutEmbedded = useEmbeddedLayout();
	const unreadMessagesBadge = useSession('unread') as number | string | undefined;

	const toggleSidebar = useEffectEvent(() => sidebar.toggle());

	return <SidebarTogglerButton onClick={toggleSidebar} badge={!isLayoutEmbedded && unreadMessagesBadge && unreadMessagesBadge} />;
};

export default memo(SideBarToggler);
