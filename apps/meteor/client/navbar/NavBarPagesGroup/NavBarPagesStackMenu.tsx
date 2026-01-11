import { NavBarItem } from '@rocket.chat/fuselage';
import { useEffectEvent, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useCurrentRoutePath, useLayout, useRouter, useSetting } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { useSortMenu } from '../hooks/useSortMenu';

type NavBarPagesStackMenuProps = Omit<HTMLAttributes<HTMLElement>, 'is'> & {
	showMarketplace: boolean;
};


const NavBarPagesStackMenu = ({ showMarketplace, ...props }: NavBarPagesStackMenuProps) => {
	const { t } = useTranslation();

	const showHome = useSetting('Layout_Show_Home_Button');
	const { sidebar } = useLayout();
	const router = useRouter();
	const isSmall = useMediaQuery('(max-width: 768px)');
	const sortSections = useSortMenu();

	const handleGoToHome = useEffectEvent(() => {
		sidebar.toggle();
		router.navigate('/home');
	});

	const currentRoute = useCurrentRoutePath();
	const pressed =
		currentRoute?.includes('/home') ||
		currentRoute?.includes('/directory') ||
		currentRoute?.includes('/marketplace');

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
		isSmall && {
			id: 'marketplace',
			icon: 'store',
			content: t('Marketplace'),
			onClick: () => router.navigate('/marketplace'),
		},
		isSmall && {
			id: 'display',
			icon: 'sort',
			content: t('Display'),
			onClick: () =>
				GenericMenu.open({
					title: t('Display'),
					sections: sortSections,
					selectionMode: 'multiple',
				}),
		},
		showMarketplace && {
			id: 'marketplace',
			icon: 'store',
			content: t('Marketplace'),
			onClick: () => router.navigate('/marketplace'),
		},
	].filter(Boolean) as GenericMenuItemProps[];

	return (
		<GenericMenu
			items={items}
			title={t('Pages')}
			is={NavBarItem}
			placement='bottom-start'
			icon='stack'
			pressed={pressed}
			{...props}
		/>
	);
};

export default NavBarPagesStackMenu;
