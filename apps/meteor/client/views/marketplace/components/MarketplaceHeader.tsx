import { Box, Button, ButtonGroup, Skeleton } from '@rocket.chat/fuselage';
import { usePermission, useRoute, useRouteParameter, useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';

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
	const handleModalClose = useCallback(() => setModal(null), [setModal]);

	const handleUploadButtonClick = useCallback((): void => {
		route.push({ context, page: 'install' });
	}, [context, route]);

	if (result.isLoading) {
		return (
			<Box w='x180' h='x40' mi='x8' fontScale='c1' display='flex' flexDirection='column' justifyContent='space-around'>
				<Box color='default'>{t('Active_connections')}</Box>
				<Skeleton w='full' />
			</Box>
		);
	}

	if (result.isError) {
		return null;
	}

	return (
		<Box display='flex' pi='24px' pb='12px' alignItems='center' justifyContent='space-between'>
			<Box fontScale='h2'>{title}</Box>
			<Box display='flex' flexDirection='row' flexWrap='wrap'>
				{!result.data.hasUnlimitedApps && <EnabledAppsCount {...result.data} context={context} />}
				{isAdmin && (
					<ButtonGroup>
						{!result.data.hasUnlimitedApps && (
							<Button
								onClick={() => {
									setModal(<UnlimitedAppsUpsellModal onClose={handleModalClose} />);
								}}
							>
								{t('Enable_unlimited_apps')}
							</Button>
						)}
						{context === 'private' && <Button onClick={handleUploadButtonClick}>{t('Upload_private_app')}</Button>}
					</ButtonGroup>
				)}
			</Box>
		</Box>
	);
};

export default MarketplaceHeader;
