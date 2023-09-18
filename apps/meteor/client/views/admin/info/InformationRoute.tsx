import { Callout, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import Page from '../../../components/Page';
import PageSkeleton from '../../../components/PageSkeleton';
import { useWorkspaceInfo } from '../../../hooks/useWorkspaceInfo';
import { downloadJsonAs } from '../../../lib/download';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import InformationPage from './InformationPage';

const InformationRoute = (): ReactElement => {
	const t = useTranslation();
	const canViewStatistics = usePermission('view-statistics');

	const { instances, statistics, serverInfo, isLoading, isError, refetchStatistics } = useWorkspaceInfo();

	const handleClickRefreshButton = (): void => {
		if (isLoading) {
			return;
		}

		refetchStatistics();
	};

	const handleClickDownloadInfo = (): void => {
		if (isLoading) {
			return;
		}
		downloadJsonAs(statistics, 'statistics');
	};

	if (isLoading) {
		return <PageSkeleton />;
	}

	if (isError || !statistics || !serverInfo) {
		return (
			<Page>
				<Page.Header title={t('Workspace_status')}>
					<ButtonGroup>
						<Button icon='reload' primary type='button' onClick={handleClickRefreshButton}>
							{t('Refresh')}
						</Button>
					</ButtonGroup>
				</Page.Header>
				<Page.ScrollableContentWithShadow>
					<Callout type='danger'>{t('Error_loading_pages')}</Callout>
				</Page.ScrollableContentWithShadow>
			</Page>
		);
	}

	if (canViewStatistics) {
		return (
			<InformationPage
				canViewStatistics={canViewStatistics}
				serverInfo={serverInfo}
				statistics={statistics}
				instances={instances}
				onClickRefreshButton={handleClickRefreshButton}
				onClickDownloadInfo={handleClickDownloadInfo}
			/>
		);
	}

	return <NotAuthorizedPage />;
};

export default memo(InformationRoute);
