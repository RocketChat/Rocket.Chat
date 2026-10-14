import { NavBarItem } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import PageModal from './PageModal/PageModal';
import PageSkeleton from '../../components/PageSkeleton';

const OmnichannelDirectoryRouter = lazy(() => import('../../views/omnichannel/directory/OmnichannelDirectoryRouter'));

type SidebarRailContactCenterProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

/**
 * Opens the omnichannel Contact Center in a modal rather than on its page, so it is never marked active next to the
 * Inbox or Teams item. Its chat and contact details still open beside the list, inside the modal.
 */
const SidebarRailContactCenter = (props: SidebarRailContactCenterProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();

	const handleClick = () => {
		const close = () => setModal(null);

		setModal(
			<PageModal
				routeName='omnichannel-directory'
				pattern='/omnichannel-directory/:tab?/:context?/:id?'
				initialParams={{ tab: 'chats' }}
				aria-label={t('Omnichannel_Contact_Center')}
				onClose={close}
			>
				<Suspense fallback={<PageSkeleton />}>
					<OmnichannelDirectoryRouter onClose={close} />
				</Suspense>
			</PageModal>,
		);
	};

	return <NavBarItem {...props} icon='address-book' title={t('Contact_Center')} aria-haspopup='dialog' onClick={handleClick} />;
};

export default SidebarRailContactCenter;
