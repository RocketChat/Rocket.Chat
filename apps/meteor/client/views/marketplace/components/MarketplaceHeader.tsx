import { Button, ButtonGroup, Margins } from '@rocket.chat/fuselage';
import { usePermission, useRoute, useRouteParameter, useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { GenericResourceUsageSkeleton } from '../../../components/GenericResourceUsage';
import { PageHeader } from '../../../components/Page';
import UpgradeButton from '../../admin/subscription/components/UpgradeButton';
import UnlimitedAppsUpsellModal from '../UnlimitedAppsUpsellModal';
import { useAppsCountQuery } from '../hooks/useAppsCountQuery';
import { usePrivateAppsEnabled } from '../hooks/usePrivateAppsEnabled';
import EnabledAppsCount from './EnabledAppsCount';
import PrivateAppInstallModal from './PrivateAppInstallModal/PrivateAppInstallModal';

const MarketplaceHeader = ({ title }: { title: string }): ReactElement | null => {
	const { t } = useTranslation();
	const isAdmin = usePermission('manage-apps');
	const context = (useRouteParameter('context') || 'explore') as 'private' | 'explore' | 'installed' | 'premium' | 'requested';
	const route = useRoute('marketplace');
	const setModal = useSetModal();
	const { isLoading, isError, isSuccess, data } = useAppsCountQuery(context);

	const privateAppsEnabled = usePrivateAppsEnabled();

	const handleProceed = (): void => {
		setModal(null);
		route.push({ context, page: 'install' });
	};

	const handleClickPrivate = () => {
		if (!privateAppsEnabled) {
			setModal(<PrivateAppInstallModal onClose={() => setModal(null)} onProceed={handleProceed} />);
			return;
		}

		route.push({ context, page: 'install' });
	};

	if (isError) {
		return null;
	}

	return (
		<PageHeader title={title}>
			{isLoading && <GenericResourceUsageSkeleton mi={16} />}

			{isSuccess && !data.hasUnlimitedApps && (
				<Margins inline={16}>
					<EnabledAppsCount
						{...data}
						tooltip={context === 'private' && !privateAppsEnabled ? t('Private_apps_premium_message') : undefined}
						context={context}
					/>
				</Margins>
			)}

			<ButtonGroup wrap align='end'>
				{isAdmin && isSuccess && !data.hasUnlimitedApps && context !== 'private' && (
					<Button
						onClick={() => {
							setModal(<UnlimitedAppsUpsellModal onClose={() => setModal(null)} />);
						}}
					>
						{t('Enable_unlimited_apps')}
					</Button>
				)}

				{isAdmin && context === 'private' && <Button onClick={handleClickPrivate}>{t('Upload_private_app')}</Button>}

				{isAdmin && isSuccess && !privateAppsEnabled && context === 'private' && (
					<UpgradeButton primary target='private-apps-header' action='upgrade'>
						{t('Upgrade')}
					</UpgradeButton>
				)}
			</ButtonGroup>
		</PageHeader>
	);
};

export default MarketplaceHeader;
