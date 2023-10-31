import { Callout, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import Page from '../../../components/Page';
import PageSkeleton from '../../../components/PageSkeleton';
import { useRefreshStatistics, useWorkspaceInfo } from '../../../hooks/useWorkspaceInfo';
import { downloadJsonAs } from '../../../lib/download';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import WorkspacePage from './WorkspacePage';

const WorkspaceRoute = (): ReactElement => {
	const t = useTranslation();
	const canViewStatistics = usePermission('view-statistics');

	const [serverInfoQuery, instancesQuery, statisticsQuery] = useWorkspaceInfo();
	const refetchStatistics = useRefreshStatistics();

	if (!canViewStatistics) {
		return <NotAuthorizedPage />;
	}

	if (serverInfoQuery.isLoading || instancesQuery.isLoading || statisticsQuery.isLoading) {
		return <PageSkeleton />;
	}
	const handleClickRefreshButton = (): void => {
		refetchStatistics.mutate();
	};

	if (serverInfoQuery.isError || instancesQuery.isError || statisticsQuery.isError) {
		return (
			<Page>
				<Page.Header title={t('Workspace')}>
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

	const handleClickDownloadInfo = (): void => {
		downloadJsonAs(statisticsQuery.data, 'statistics');
	};

	return (
		<WorkspacePage
			canViewStatistics={canViewStatistics}
			serverInfo={serverInfoQuery.data}
			statistics={statisticsQuery.data}
			instances={instancesQuery.data}
			onClickRefreshButton={handleClickRefreshButton}
			onClickDownloadInfo={handleClickDownloadInfo}
		/>
	);
};

export default memo(WorkspaceRoute);
