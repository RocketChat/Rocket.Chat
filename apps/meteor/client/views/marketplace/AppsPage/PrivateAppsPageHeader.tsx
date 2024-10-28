import { Button, ButtonGroup, Margins } from '@rocket.chat/fuselage';
import { usePermission, useRouter, useSetModal } from '@rocket.chat/ui-contexts';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { GenericResourceUsageSkeleton } from '../../../components/GenericResourceUsage';
import { PageHeader } from '../../../components/Page';
import UpgradeButton from '../../admin/subscription/components/UpgradeButton';
import EnabledAppsCount from '../components/EnabledAppsCount';
import PrivateAppInstallModal from '../components/PrivateAppInstallModal/PrivateAppInstallModal';
import { useAppsCountQuery } from '../hooks/useAppsCountQuery';
import { useMarketplaceQuery } from '../hooks/useMarketplaceQuery';
import { usePrivateAppsEnabled } from '../hooks/usePrivateAppsEnabled';
import { MarketplaceUnsupportedVersionError } from '../lib/MarketplaceUnsupportedVersionError';

const PrivateAppsPageHeader = () => {
	const marketplaceQueryResult = useMarketplaceQuery();
	const unsupportedVersion = marketplaceQueryResult.isError && marketplaceQueryResult.error instanceof MarketplaceUnsupportedVersionError;

	const { t } = useTranslation();

	const canManageApps = usePermission('manage-apps');
	const router = useRouter();
	const setModal = useSetModal();
	const privateAppsEnabled = usePrivateAppsEnabled();

	const { isError, isLoading, data } = useAppsCountQuery('private');

	const handleUploadAppButtonClick = () => {
		if (!privateAppsEnabled) {
			setModal(
				<PrivateAppInstallModal
					onClose={() => setModal(null)}
					onProceed={() => {
						setModal(null);
						router.navigate({ name: 'marketplace', params: { context: 'private', page: 'install' } });
					}}
				/>,
			);
			return;
		}

		router.navigate({ name: 'marketplace', params: { context: 'private', page: 'install' } });
	};

	if (isError) {
		return null;
	}

	if (isLoading) {
		return (
			<PageHeader title={t(`Apps_context_private`)}>
				<GenericResourceUsageSkeleton mi={16} />

				{canManageApps && (
					<ButtonGroup wrap align='end'>
						<Button onClick={handleUploadAppButtonClick}>{t('Upload_private_app')}</Button>
					</ButtonGroup>
				)}
			</PageHeader>
		);
	}

	return (
		<PageHeader title={t(`Apps_context_private`)}>
			{!unsupportedVersion && !data.hasUnlimitedApps && (
				<Margins inline={16}>
					<EnabledAppsCount
						enabled={data.enabled}
						limit={data.limit}
						tooltip={!privateAppsEnabled ? t('Private_apps_premium_message') : undefined}
						context='private'
					/>
				</Margins>
			)}

			{canManageApps && (
				<ButtonGroup wrap align='end'>
					{!privateAppsEnabled && (
						<UpgradeButton primary target='private-apps-header' action='upgrade'>
							{t('Upgrade')}
						</UpgradeButton>
					)}
					<Button onClick={handleUploadAppButtonClick}>{t('Upload_private_app')}</Button>
				</ButtonGroup>
			)}
		</PageHeader>
	);
};

export default PrivateAppsPageHeader;
