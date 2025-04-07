import { Badge, Skeleton } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation, useRoute, usePermission } from '@rocket.chat/ui-contexts';

import { useUserDropdownAppsActionButtons } from '../../../../hooks/useUserDropdownAppsActionButtons';
import { useAppRequestStats } from '../../../../views/marketplace/hooks/useAppRequestStats';

export const useAppsItems = (): GenericMenuItemProps[] => {
	const t = useTranslation();

	const appBoxItems = useUserDropdownAppsActionButtons();

	const hasManageAppsPermission = usePermission('manage-apps');
	const hasAccessMarketplacePermission = usePermission('access-marketplace');

	const showMarketplace = hasAccessMarketplacePermission || hasManageAppsPermission;

	const marketplaceRoute = useRoute('marketplace');
	const page = 'list';

	const appRequestStats = useAppRequestStats();

	const marketPlaceItems: GenericMenuItemProps[] = [
		{
			id: 'marketplace',
			icon: 'store',
			content: t('Marketplace'),
			onClick: () => marketplaceRoute.push({ context: 'explore', page }),
		},
		{
			id: 'installed',
			icon: 'circle-arrow-down',
			content: t('Installed'),
			onClick: () => marketplaceRoute.push({ context: 'installed', page }),
		},
	];

	const appsManagementItem: GenericMenuItemProps = {
		id: 'requested-apps',
		icon: 'cube',
		content: t('Requested'),
		onClick: () => {
			marketplaceRoute.push({ context: 'requested', page });
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
		...(showMarketplace ? marketPlaceItems : []),
		...(hasManageAppsPermission ? [appsManagementItem] : []),
		...(appBoxItems.isSuccess ? appBoxItems.data : []),
	];
};
