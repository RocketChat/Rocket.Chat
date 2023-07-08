import { Badge, Skeleton } from '@rocket.chat/fuselage';
import { useTranslation, useRoute, usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import type { IAppAccountBoxItem } from '../../../../../app/ui-utils/client/lib/AccountBox';
import type { GenericMenuItemProps } from '../../../../components/GenericMenu/GenericMenuItem';
import { useUiKitActionManager } from '../../../../hooks/useUiKitActionManager';
import { useAppRequestStats } from '../../../../views/marketplace/hooks/useAppRequestStats';

type useAppsItemsProps = {
	appBoxItems: IAppAccountBoxItem[];
	appsManagementAllowed?: boolean;
	showMarketplace?: boolean;
};

export const useAppsItems = ({ appBoxItems }: useAppsItemsProps): GenericMenuItemProps[] => {
	const t = useTranslation();

	const hasManageAppsPermission = usePermission('manage-apps');
	const hasAccessMarketplacePermission = usePermission('access-marketplace');

	const showMarketplace = hasAccessMarketplacePermission || hasManageAppsPermission;
	const actionManager = useUiKitActionManager();

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
				{appRequestStats.isSuccess && appRequestStats.data.data.totalUnseen > 0 && (
					<Badge variant='primary'>{appRequestStats.data.data.totalUnseen}</Badge>
				)}
			</>
		),
	};

	const appItems: GenericMenuItemProps[] = appBoxItems.map((item: IAppAccountBoxItem, key: number) => {
		return {
			id: item.actionId + key,
			icon: item.icon as GenericMenuItemProps['icon'],
			content: (t.has(item.name) && t(item.name)) || item.name,
			onClick: () => {
				actionManager?.triggerActionButtonAction({
					actionId: item.actionId,
					appId: item.appId,
					payload: { context: item.context },
				});
			},
		};
	});

	return [
		...(showMarketplace ? marketPlaceItems : []),
		...(hasManageAppsPermission ? [appsManagementItem] : []),
		...(appBoxItems.length ? appItems : []),
	];
};
