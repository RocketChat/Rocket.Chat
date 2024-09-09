import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { usePermission, useRoute, useRouteParameter, useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';

import { GenericResourceUsageSkeleton } from '../../../components/GenericResourceUsage';
import { PageHeader } from '../../../components/Page';
import UnlimitedAppsUpsellModal from '../UnlimitedAppsUpsellModal';
import { useAppsCountQuery } from '../hooks/useAppsCountQuery';
import EnabledAppsCount from './EnabledAppsCount';
import UpdateRocketChatBtn from './UpdateRocketChatBtn';

const MarketplaceHeader = ({ title }: { title: string }): ReactElement | null => {
	const t = useTranslation();
	const isAdmin = usePermission('manage-apps');
	const context = (useRouteParameter('context') || 'explore') as 'private' | 'explore' | 'installed' | 'premium' | 'requested';
	const route = useRoute('marketplace');
	const setModal = useSetModal();
	const result = useAppsCountQuery(context);

	// TODO, add api error return when https://rocketchat.atlassian.net/browse/CONN-334 is done
	const unsupportedVersion = result.error === 'unsupported version';

	const handleUploadButtonClick = useCallback((): void => {
		route.push({ context, page: 'install' });
	}, [context, route]);

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
				{!unsupportedVersion && isAdmin && result.isSuccess && !result.data.hasUnlimitedApps && (
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

				{unsupportedVersion && <UpdateRocketChatBtn />}
			</ButtonGroup>
		</PageHeader>
	);
};

export default MarketplaceHeader;
