import { Button, ButtonGroup, Margins } from '@rocket.chat/fuselage';
import { usePermission, useRouter, useSetModal } from '@rocket.chat/ui-contexts';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { GenericResourceUsageSkeleton } from '../../../components/GenericResourceUsage';
import { PageHeader } from '../../../components/Page';
import UpgradeButton from '../../admin/subscription/components/UpgradeButton';
import UnlimitedAppsUpsellModal from '../UnlimitedAppsUpsellModal';
import EnabledAppsCount from '../components/EnabledAppsCount';
import PrivateAppInstallModal from '../components/PrivateAppInstallModal/PrivateAppInstallModal';
import UpdateRocketChatButton from '../components/UpdateRocketChatButton';
import { useAppsCountQuery } from '../hooks/useAppsCountQuery';
import { useMarketplaceContext } from '../hooks/useMarketplaceContext';
import { useMarketplaceQuery } from '../hooks/useMarketplaceQuery';
import { usePrivateAppsEnabled } from '../hooks/usePrivateAppsEnabled';
import { MarketplaceUnsupportedVersionError } from '../lib/MarketplaceUnsupportedVersionError';

const AppsPageHeader = () => {
	const marketplaceQueryResult = useMarketplaceQuery();
	const unsupportedVersion = marketplaceQueryResult.isError && marketplaceQueryResult.error instanceof MarketplaceUnsupportedVersionError;

	const context = useMarketplaceContext();

	const { t } = useTranslation();

	const canManageApps = usePermission('manage-apps');
	const router = useRouter();
	const setModal = useSetModal();
	const result = useAppsCountQuery(context);

	const privateAppsEnabled = usePrivateAppsEnabled();

	const handleProceed = () => {
		setModal(null);
		router.navigate({ name: 'marketplace', params: { context, page: 'install' } });
	};

	const handleClickPrivate = () => {
		if (!privateAppsEnabled) {
			setModal(<PrivateAppInstallModal onClose={() => setModal(null)} onProceed={handleProceed} />);
			return;
		}

		router.navigate({ name: 'marketplace', params: { context, page: 'install' } });
	};

	if (result.isError) {
		return null;
	}

	return (
		<PageHeader title={t(`Apps_context_${context}`)}>
			{result.isLoading && <GenericResourceUsageSkeleton mi={16} />}

			{!unsupportedVersion && result.isSuccess && !result.data.hasUnlimitedApps && (
				<Margins inline={16}>
					<EnabledAppsCount
						{...result.data}
						tooltip={context === 'private' && !privateAppsEnabled ? t('Private_apps_premium_message') : undefined}
						context={context}
					/>
				</Margins>
			)}

			{canManageApps && (
				<ButtonGroup wrap align='end'>
					{context === 'private' ? (
						<>
							<Button onClick={handleClickPrivate}>{t('Upload_private_app')}</Button>
							{result.isSuccess && !privateAppsEnabled && (
								<UpgradeButton primary target='private-apps-header' action='upgrade'>
									{t('Upgrade')}
								</UpgradeButton>
							)}
						</>
					) : (
						<>
							{!unsupportedVersion && result.isSuccess && !result.data.hasUnlimitedApps && (
								<Button
									onClick={() => {
										setModal(<UnlimitedAppsUpsellModal onClose={() => setModal(null)} />);
									}}
								>
									{t('Enable_unlimited_apps')}
								</Button>
							)}
							{unsupportedVersion && <UpdateRocketChatButton />}
						</>
					)}
				</ButtonGroup>
			)}
		</PageHeader>
	);
};

export default AppsPageHeader;
