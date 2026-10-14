import { NavBarItem } from '@rocket.chat/fuselage';
import { useSetModal, useSetting } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import PageModal from './PageModal/PageModal';
import PageSkeleton from '../../components/PageSkeleton';

const DirectoryPage = lazy(() => import('../../views/directory'));

type SidebarRailDirectoryProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

/**
 * Opens the Directory in a modal rather than on its page, so it is never marked active next to the Inbox or Teams
 * item, which already show what the sidebar lists.
 */
const SidebarRailDirectory = (props: SidebarRailDirectoryProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const defaultTab = useSetting<string>('Accounts_Directory_DefaultView', 'users');

	const handleClick = () => {
		const close = () => setModal(null);

		setModal(
			<PageModal
				routeName='directory'
				pattern='/directory/:tab?'
				initialParams={{ tab: defaultTab }}
				aria-label={t('Directory')}
				onClose={close}
			>
				<Suspense fallback={<PageSkeleton />}>
					<DirectoryPage onClose={close} />
				</Suspense>
			</PageModal>,
		);
	};

	return <NavBarItem {...props} icon='notebook-hashtag' title={t('Directory')} aria-haspopup='dialog' onClick={handleClick} />;
};

export default SidebarRailDirectory;
