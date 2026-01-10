import { NavBarItem } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useCurrentRoutePath, useLayout, useRouter, useSetting, usePermission } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { useSortMenu } from './hooks/useSortMenu';

type NavBarPagesStackMenuProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarPagesStackMenu = (props: NavBarPagesStackMenuProps) => {
	const { t } = useTranslation();

	const showHome = useSetting('Layout_Show_Home_Button');
	const { sidebar } = useLayout();
	const router = useRouter();

	const hasManageAppsPermission = usePermission('manage-apps');
	const hasAccessMarketplacePermission = usePermission('access-marketplace');
	const showMarketplace = hasAccessMarketplacePermission || hasManageAppsPermission;

	const sortMenuSections = useSortMenu();

	const handleGoToHome = useEffectEvent(() => {
		sidebar.toggle();
		router.navigate('/home');
	});

	const currentRoute = useCurrentRoutePath();
	const pressed = currentRoute?.includes('/directory') || currentRoute?.includes('/home') || currentRoute?.includes('/marketplace');

	const items = [
		showHome && {
			id: 'home',
			icon: 'home',
			content: t('Home'),
			onClick: handleGoToHome,
		},
		{
			id: 'directory',
			icon: 'notebook-hashtag',
			content: t('Directory'),
			onClick: () => router.navigate('/directory'),
		},
		showMarketplace && {
			id: 'marketplace',
			icon: 'store',
			content: t('Marketplace'),
			onClick: () => router.navigate('/marketplace'),
		},
	].filter(Boolean) as GenericMenuItemProps[];

	const sections = [
		{
			title: t('Pages'),
			items,
		},
		...sortMenuSections,
	];

	return (
		<GenericMenu
			sections={sections}
			title={t('Pages')}
			is={NavBarItem}
			placement='bottom-start'
			icon='stack'
			pressed={pressed}
			selectionMode='multiple'
			{...props}
		/>
	);
};

export default NavBarPagesStackMenu;
