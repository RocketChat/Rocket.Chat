import { Badge, Skeleton } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation, usePermission, useRouter } from '@rocket.chat/ui-contexts';

import { useUserDropdownAppsActionButtons } from '../../../hooks/useUserDropdownAppsActionButtons';
import { useAppRequestStats } from '../../../views/marketplace/hooks/useAppRequestStats';

export const useMarketPlaceMenu = () => {
	const t = useTranslation();

	const appBoxItems = useUserDropdownAppsActionButtons();

	const hasManageAppsPermission = usePermission('manage-apps');
	const hasAccessMarketplacePermission = usePermission('access-marketplace');

	const showMarketplace = hasAccessMarketplacePermission || hasManageAppsPermission;

	const router = useRouter();

	const appRequestStats = useAppRequestStats();

	const marketPlaceItems: GenericMenuItemProps[] = [
		{
			id: 'explore',
			icon: 'compass',
			content: t('Explore'),
			onClick: () => router.navigate('/marketplace/explore/list'),
		},
		{
			id: 'installed',
			icon: 'circle-arrow-down',
			content: t('Installed'),
			onClick: () => router.navigate('/marketplace/installed/list'),
		},
	];

	const appsManagementItem: GenericMenuItemProps = {
		id: 'requested-apps',
		icon: 'cube',
		content: t('Requested'),
		onClick: () => {
			router.navigate('/marketplace/requested/list');
		},
		addon: (
			<>
				{appRequestStats.isLoading && <Skeleton variant='circle' height={16} width={16} />}
				{appRequestStats.isSuccess && appRequestStats.data.totalUnseen > 0 && (
					<Badge variant='primary'>{appRequestStats.data.totalUnseen}</Badge>
				)}
			</>
		),
	};

	return [
		{
			title: t('Marketplace'),
			items: [
				...(showMarketplace ? marketPlaceItems : []),
				...(hasManageAppsPermission ? [appsManagementItem] : []),
				...(appBoxItems.isSuccess ? appBoxItems.data : []),
			],
		},
	];
};
