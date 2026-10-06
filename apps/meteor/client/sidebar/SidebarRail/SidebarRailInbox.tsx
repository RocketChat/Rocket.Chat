import { NavBarItem } from '@rocket.chat/fuselage';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { useSidebarRailStore } from './useSidebarRailStore';

type SidebarRailInboxProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const SidebarRailInbox = (props: SidebarRailInboxProps) => {
	const { t } = useTranslation();
	const isActive = useSidebarRailStore((state) => state.panel === 'inbox');
	const setPanel = useSidebarRailStore((state) => state.setPanel);

	return <NavBarItem {...props} title={t('Inbox')} icon='inbox' pressed={isActive} onClick={() => setPanel('inbox')} />;
};

export default SidebarRailInbox;
