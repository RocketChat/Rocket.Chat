import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { usePermission, useRoute, useRouteParameter, useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import { useHasLicenseModule } from '../../../../ee/client/hooks/useHasLicenseModule';
import UnlimitedAppsUpsellModal from '../UnlimitedAppsUpsellModal';
import EnabledAppsCount from './EnabledAppsCount';

const MarketplaceHeader = ({ title }: { title: string }) => {
	const t = useTranslation();
	const isAdmin = usePermission('manage-apps');
	const hasEnterpriseLicense = useHasLicenseModule('marketplace-enterprise');
	const context = useRouteParameter('context') || 'explore';
	const route = useRoute('marketplace');
	const setModal = useSetModal();

	const handleUploadButtonClick = useCallback((): void => {
		route.push({ context, page: 'install' });
	}, [context, route]);

	return (
		<Box display='flex' pi='24px' pb='12px' alignItems='center' justifyContent='space-between'>
			<Box fontScale='h2'>{title}</Box>
			<Box display='flex' flexDirection='row' flexWrap='wrap'>
				<EnabledAppsCount />
				{isAdmin && (
					<ButtonGroup>
						{!hasEnterpriseLicense && (
							<Button
								onClick={() => {
									setModal(<UnlimitedAppsUpsellModal />);
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
