import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { usePermission, useRoute, useRouteParameter, useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';

import { GenericResourceUsageSkeleton } from '../../../components/GenericResourceUsage';
import Page from '../../../components/Page';
import UnlimitedAppsUpsellModal from '../UnlimitedAppsUpsellModal';
import { useAppsCountQuery } from '../hooks/useAppsCountQuery';
import EnabledAppsCount from './EnabledAppsCount';

const MarketplaceHeader = ({ title }: { title: string }): ReactElement | null => {
	const t = useTranslation();
	const isAdmin = usePermission('manage-apps');
	const context = (useRouteParameter('context') || 'explore') as 'private' | 'explore' | 'installed' | 'enterprise' | 'requested';
	const route = useRoute('marketplace');
	const setModal = useSetModal();
	const result = useAppsCountQuery(context);

	const handleUploadButtonClick = useCallback((): void => {
		route.push({ context, page: 'install' });
	}, [context, route]);

	if (result.isError) {
		return null;
	}

	return (
		<Page.Header title={title}>
			<ButtonGroup flexWrap='wrap' justifyContent='flex-end'>
				{result.isLoading && <GenericResourceUsageSkeleton />}
				{result.isSuccess && !result.data.hasUnlimitedApps && <EnabledAppsCount {...result.data} context={context} />}
				{isAdmin && result.isSuccess && !result.data.hasUnlimitedApps && (
					<Button
						onClick={() => {
							setModal(<UnlimitedAppsUpsellModal onClose={() => setModal(null)} />);
						}}
					>
						{t('Enable_unlimited_apps')}
					</Button>
				)}
				{isAdmin && context === 'private' && <Button onClick={handleUploadButtonClick}>{t('Upload_private_app')}</Button>}
			</ButtonGroup>
		</Page.Header>
	);
};

export default MarketplaceHeader;
