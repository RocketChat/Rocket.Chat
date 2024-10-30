import { Button, ButtonGroup, Margins } from '@rocket.chat/fuselage';
import { usePermission, useSetModal } from '@rocket.chat/ui-contexts';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { GenericResourceUsageSkeleton } from '../../../components/GenericResourceUsage';
import { PageHeader } from '../../../components/Page';
import UnlimitedAppsUpsellModal from '../UnlimitedAppsUpsellModal';
import EnabledAppsCount from '../components/EnabledAppsCount';
import UpdateRocketChatButton from '../components/UpdateRocketChatButton';
import { useAppsCountQuery } from '../hooks/useAppsCountQuery';
import { useMarketplaceContext } from '../hooks/useMarketplaceContext';
import { useMarketplaceQuery } from '../hooks/useMarketplaceQuery';
import { MarketplaceUnsupportedVersionError } from '../lib/MarketplaceUnsupportedVersionError';

const DefaultAppsPageHeader = () => {
	const marketplaceQueryResult = useMarketplaceQuery();
	const unsupportedVersion = marketplaceQueryResult.isError && marketplaceQueryResult.error instanceof MarketplaceUnsupportedVersionError;

	const context = useMarketplaceContext();

	const { t } = useTranslation();
	const canManageApps = usePermission('manage-apps');
	const setModal = useSetModal();

	const { isError, isLoading, data } = useAppsCountQuery(context);

	if (isError) {
		return null;
	}

	if (unsupportedVersion) {
		return (
			<PageHeader title={t(`Apps_context_${context}`)}>
				{canManageApps && (
					<ButtonGroup wrap align='end'>
						<UpdateRocketChatButton />
					</ButtonGroup>
				)}
			</PageHeader>
		);
	}

	if (isLoading) {
		return (
			<PageHeader title={t(`Apps_context_${context}`)}>
				<GenericResourceUsageSkeleton mi={16} />

				{canManageApps && (
					<ButtonGroup wrap align='end'>
						<UpdateRocketChatButton />
					</ButtonGroup>
				)}
			</PageHeader>
		);
	}

	return (
		<PageHeader title={t(`Apps_context_${context}`)}>
			{!data.hasUnlimitedApps && (
				<Margins inline={16}>
					<EnabledAppsCount enabled={data.enabled} limit={data.limit} context={context} />
				</Margins>
			)}

			{canManageApps && (
				<ButtonGroup wrap align='end'>
					{!data.hasUnlimitedApps && (
						<Button
							onClick={() => {
								setModal(<UnlimitedAppsUpsellModal onClose={() => setModal(null)} />);
							}}
						>
							{t('Enable_unlimited_apps')}
						</Button>
					)}
				</ButtonGroup>
			)}
		</PageHeader>
	);
};

export default DefaultAppsPageHeader;
