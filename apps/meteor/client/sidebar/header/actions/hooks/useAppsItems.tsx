import { Badge, Skeleton } from '@rocket.chat/fuselage';
import { useTranslation, useRoute } from '@rocket.chat/ui-contexts';
import React from 'react';

import { triggerActionButtonAction } from '../../../../../app/ui-message/client/ActionManager';
import type { IAppAccountBoxItem } from '../../../../../app/ui-utils/client/lib/AccountBox';
import type { GenericMenuItemProps } from '../../../../components/GenericMenu/GenericMenuItem';
import { useAppRequestStats } from '../../../../views/marketplace/hooks/useAppRequestStats';

type useAppsItemsProps = {
	appBoxItems: IAppAccountBoxItem[];
	appsManagementAllowed?: boolean;
	showMarketplace?: boolean;
};

export const useAppsItems = ({ appBoxItems, appsManagementAllowed, showMarketplace }: useAppsItemsProps): GenericMenuItemProps[] => {
	const t = useTranslation();

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
		const action = () => {
			triggerActionButtonAction({
				rid: '',
				mid: '',
				actionId: item.actionId,
				appId: item.appId,
				payload: { context: item.context },
			});
		};
		return {
			id: item.actionId + key,
			icon: item.icon as GenericMenuItemProps['icon'],
			content: (t.has(item.name) && t(item.name)) || item.name,
			onClick: action,
		};
	});
	return [
		...(showMarketplace ? marketPlaceItems : []),
		...(appsManagementAllowed ? [appsManagementItem] : []),
		...(appBoxItems.length ? appItems : []),
	];
};
