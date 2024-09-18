import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { usePermission, useRoute, useRouteParameter, useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import type { MutableRefObject, ReactElement } from 'react';
import React from 'react';

import { GenericResourceUsageSkeleton } from '../../../components/GenericResourceUsage';
import { PageHeader } from '../../../components/Page';
import UpgradeButton from '../../admin/subscription/components/UpgradeButton';
import UnlimitedAppsUpsellModal from '../UnlimitedAppsUpsellModal';
import { useAppsCountQuery } from '../hooks/useAppsCountQuery';
import EnabledAppsCount from './EnabledAppsCount';
import PrivateAppInstallModal from './PrivateAppInstallModal/PrivateAppInstallModal';
import UpdateRocketChatBtn from './UpdateRocketChatBtn';

const MarketplaceHeader = ({
	title,
	unsupportedVersion,
}: {
	title: string;
	unsupportedVersion: MutableRefObject<boolean>;
}): ReactElement | null => {
	const t = useTranslation();
	const isAdmin = usePermission('manage-apps');
	const context = (useRouteParameter('context') || 'explore') as 'private' | 'explore' | 'installed' | 'premium' | 'requested';
	const route = useRoute('marketplace');
	const setModal = useSetModal();
	const result = useAppsCountQuery(context);

	const handleProceed = (): void => {
		setModal(null);
		route.push({ context, page: 'install' });
	};

	const handleClickPrivate = () => {
		result?.data?.limit === 0
			? setModal(<PrivateAppInstallModal onClose={() => setModal(null)} onProceed={handleProceed} />)
			: route.push({ context, page: 'install' });
	};

	if (result.isError) {
		return null;
	}

	return (
		<PageHeader title={title}>
			<ButtonGroup wrap align='end'>
				{result.isLoading && <GenericResourceUsageSkeleton />}
				{!unsupportedVersion && result.isSuccess && !result.data.hasUnlimitedApps && (
					<EnabledAppsCount {...result.data} context={context} />
				)}
				{!unsupportedVersion && isAdmin && result.isSuccess && !result.data.hasUnlimitedApps && context !== 'private' && (
					<Button
						onClick={() => {
							setModal(<UnlimitedAppsUpsellModal onClose={() => setModal(null)} />);
						}}
					>
						{t('Enable_unlimited_apps')}
					</Button>
				)}

				{!unsupportedVersion && isAdmin && context === 'private' && (
					<Button onClick={handleUploadButtonClick}>{t('Upload_private_app')}</Button>
				)}

				{isAdmin && result.isSuccess && result.data.limit === 0 && context === 'private' && (
					<UpgradeButton primary icon={undefined} target='private-apps-header' action='upgrade'>
						{t('Upgrade')}
					</UpgradeButton>
				)}

				{unsupportedVersion && <UpdateRocketChatBtn />}
			</ButtonGroup>
		</PageHeader>
	);
};

export default MarketplaceHeader;
