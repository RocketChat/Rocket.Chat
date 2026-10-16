import { NavBarItem } from '@rocket.chat/fuselage';
import type { HTMLAttributes } from 'react';
import { lazy } from 'react';
import { useTranslation } from 'react-i18next';

import { useOpenPageModal } from './PageModal/useOpenPageModal';

const OmnichannelDirectoryRouter = lazy(() => import('../../views/omnichannel/directory/OmnichannelDirectoryRouter'));

type SidebarRailContactCenterProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

/**
 * Opens the omnichannel Contact Center in a modal rather than on its page, so it is never marked active next to the
 * Inbox or Teams item. Its chat and contact details still open beside the list, inside the modal.
 */
const SidebarRailContactCenter = (props: SidebarRailContactCenterProps) => {
	const { t } = useTranslation();
	const openPageModal = useOpenPageModal();

	const handleClick = () =>
		openPageModal({
			routeName: 'omnichannel-directory',
			pattern: '/omnichannel-directory/:tab?/:context?/:id?',
			params: { tab: 'chats' },
			label: t('Omnichannel_Contact_Center'),
			page: <OmnichannelDirectoryRouter />,
		});

	return <NavBarItem {...props} icon='address-book' title={t('Contact_Center')} aria-haspopup='dialog' onClick={handleClick} />;
};

export default SidebarRailContactCenter;
