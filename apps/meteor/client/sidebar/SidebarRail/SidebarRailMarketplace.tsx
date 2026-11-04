import { NavBarItem } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { HTMLAttributes } from 'react';
import { lazy, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useOpenPageModal } from './PageModal/useOpenPageModal';
import SidebarRailMarketplaceNav from './SidebarRailMarketplaceNav';
import { useMarketPlaceMenu } from '../../navbar/NavBarPagesGroup/hooks/useMarketPlaceMenu';

const AppsRoute = lazy(() => import('../../views/marketplace/AppsRoute'));

const contextByItem: Record<string, string> = {
	'explore': 'explore',
	'installed': 'installed',
	'requested-apps': 'requested',
};

type SidebarRailMarketplaceProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

/**
 * The Marketplace menu of the rail, whose items open the Marketplace in a modal rather than on its pages, so the
 * Marketplace item is never marked active next to the Inbox or Teams item.
 */
const SidebarRailMarketplace = (props: SidebarRailMarketplaceProps) => {
	const { t } = useTranslation();
	const openPageModal = useOpenPageModal();
	const menuSections = useMarketPlaceMenu();

	const sections = useMemo(
		() =>
			menuSections.map((section) => ({
				...section,
				items: section.items.map((item) => ({
					...item,
					onClick: () =>
						openPageModal({
							routeName: 'marketplace',
							pattern: '/marketplace/:context?/:page?/:id?/:version?/:tab?/:contextualBar?',
							params: { context: contextByItem[item.id] ?? 'explore', page: 'list' },
							label: t('Marketplace'),
							page: <AppsRoute />,
							sidebar: <SidebarRailMarketplaceNav />,
						}),
				})),
			})),
		[menuSections, openPageModal, t],
	);

	return <GenericMenu sections={sections} title={t('Marketplace')} is={NavBarItem} placement='bottom-start' icon='store' {...props} />;
};

export default SidebarRailMarketplace;
