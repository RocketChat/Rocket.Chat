import { NavBarItem } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import { lazy } from 'react';
import { useTranslation } from 'react-i18next';

import { useOpenPageModal } from './PageModal/useOpenPageModal';

const DirectoryPage = lazy(() => import('../../views/directory'));

type SidebarRailDirectoryProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

/**
 * Opens the Directory in a modal rather than on its page, so it is never marked active next to the Inbox or Teams
 * item, which already show what the sidebar lists.
 */
const SidebarRailDirectory = (props: SidebarRailDirectoryProps) => {
	const { t } = useTranslation();
	const openPageModal = useOpenPageModal();
	const defaultTab = useSetting<string>('Accounts_Directory_DefaultView', 'users');

	const handleClick = () =>
		openPageModal({
			routeName: 'directory',
			pattern: '/directory/:tab?',
			params: { tab: defaultTab },
			label: t('Directory'),
			page: <DirectoryPage />,
		});

	return <NavBarItem {...props} icon='notebook-hashtag' title={t('Directory')} aria-haspopup='dialog' onClick={handleClick} />;
};

export default SidebarRailDirectory;
