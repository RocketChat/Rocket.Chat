import { Skeleton, Badge, IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation, useRoute, usePermission, useRouter } from '@rocket.chat/ui-contexts';
import type { AllHTMLAttributes } from 'react';
import React from 'react';

import { triggerActionButtonAction } from '../../../app/ui-message/client/ActionManager';
import { AccountBox } from '../../../app/ui-utils/client';
import type { IAppAccountBoxItem } from '../../../app/ui-utils/client/lib/AccountBox';
import { isAppAccountBoxItem } from '../../../app/ui-utils/client/lib/AccountBox';
import GenericMenu from '../../components/GenericMenu/GenericMenu';
import { useHandleMenuAction } from '../../components/GenericMenu/hooks/useHandleMenuAction';
import { NavbarAction } from '../../components/Navbar';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { useAppRequestStats } from '../../views/marketplace/hooks/useAppRequestStats';

const NavbarMarketplaceAction = (props: AllHTMLAttributes<HTMLLIElement>) => {
	const t = useTranslation();
	const router = useRouter();
	const marketplaceRoute = useRoute('marketplace');
	const routeName = router.getRouteName();

	const appRequestStats = useAppRequestStats();

	const page = 'list';

	const hasManageAppsPermission = usePermission('manage-apps');
	const hasAccessMarketplacePermission = usePermission('access-marketplace');

	const getAccountBoxItems = useMutableCallback(() => AccountBox.getItems());
	const accountBoxItems = useReactiveValue(getAccountBoxItems);
	const appBoxItems = accountBoxItems.filter((item): item is IAppAccountBoxItem => isAppAccountBoxItem(item));

	const showApps = hasAccessMarketplacePermission || hasManageAppsPermission || !!appBoxItems.length;
	const showMarketplace = hasAccessMarketplacePermission || hasManageAppsPermission;
	const appsManagementAllowed = hasManageAppsPermission;

	const marketPlaceItems = [
		{
			id: 'marketplace',
			content: t('Marketplace') as TranslationKey,
			onClick: () => marketplaceRoute.push({ context: 'explore', page }),
		},
		{
			id: 'installed',
			content: t('Installed') as TranslationKey,
			onClick: () => marketplaceRoute.push({ context: 'installed', page }),
		},
	];

	const appsManagementItem = {
		id: 'requested-apps',
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

	const appItems = appBoxItems.map((item: IAppAccountBoxItem, key: number) => {
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
			content: (t.has(item.name) && t(item.name)) || item.name,
			onClick: action,
		};
	});

	const menuItems = [
		...(showMarketplace ? marketPlaceItems : []),
		...(appsManagementAllowed ? [appsManagementItem] : []),
		...(appBoxItems.length ? appItems : []),
	];

	const handleAction = useHandleMenuAction(menuItems);

	if (!showApps) {
		return (
			<NavbarAction {...props}>
				<IconButton icon='store' disabled />
			</NavbarAction>
		);
	}

	return (
		<NavbarAction {...props}>
			<GenericMenu
				pressed={routeName === 'marketplace'}
				medium
				title={t('Marketplace')}
				icon='store'
				onAction={handleAction}
				items={menuItems}
			/>
		</NavbarAction>
	);
};

export default NavbarMarketplaceAction;
