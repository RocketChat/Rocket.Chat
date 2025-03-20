import { Button, ButtonGroup, Margins } from '@rocket.chat/fuselage';
import { usePermission, useRoute, useRouteParameter, useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { GenericResourceUsageSkeleton } from '../../../components/GenericResourceUsage';
import { PageHeader } from '../../../components/Page';
import UpgradeButton from '../../admin/subscription/components/UpgradeButton';
import UnlimitedAppsUpsellModal from '../UnlimitedAppsUpsellModal';
import EnabledAppsCount from './EnabledAppsCount';
import { useAppsCountQuery } from '../hooks/useAppsCountQuery';
import { usePrivateAppsEnabled } from '../hooks/usePrivateAppsEnabled';
import PrivateAppInstallModal from './PrivateAppInstallModal/PrivateAppInstallModal';
import UpdateRocketChatButton from './UpdateRocketChatButton';

const MarketplaceHeader = ({ title, unsupportedVersion }: { title: string; unsupportedVersion: boolean }): ReactElement | null => {
	const { t } = useTranslation();
	const isAdmin = usePermission('manage-apps');
	const context = (useRouteParameter('context') || 'explore') as 'private' | 'explore' | 'installed' | 'premium' | 'requested';
	const route = useRoute('marketplace');
	const setModal = useSetModal();
	const result = useAppsCountQuery(context);

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

	if (result.isError) {
		return null;
	}

	return (
		<PageHeader title={title}>
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

			<ButtonGroup wrap align='end'>
				{!unsupportedVersion && isAdmin && result.isSuccess && !result.data.hasUnlimitedApps && context !== 'private' && (
					<Button
						onClick={() => {
							setModal(<UnlimitedAppsUpsellModal onClose={() => setModal(null)} />);
						}}
					>
						{t('Enable_unlimited_apps')}
					</Button>
				)}
				{isAdmin && context === 'private' && <Button onClick={handleClickPrivate}>{t('Upload_private_app')}</Button>}

				{isAdmin && result.isSuccess && !privateAppsEnabled && context === 'private' && (
					<UpgradeButton primary target='private-apps-header' action='upgrade'>
						{t('Upgrade')}
					</UpgradeButton>
				)}
				{unsupportedVersion && isAdmin && context !== 'private' && <UpdateRocketChatButton />}
			</ButtonGroup>
		</PageHeader>
	);
};

export default MarketplaceHeader;
