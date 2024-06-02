import { Callout, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo, useState } from 'react';

import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';
import PageSkeleton from '../../../components/PageSkeleton';
import { useWorkspaceInfo } from '../../../hooks/useWorkspaceInfo';
import { downloadJsonAs } from '../../../lib/download';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import WorkspacePage from './WorkspacePage';

const WorkspaceRoute = (): ReactElement => {
	const t = useTranslation();
	const canViewStatistics = usePermission('view-statistics');

	const [refreshStatistics, setRefreshStatistics] = useState(false);
	const [serverInfoQuery, instancesQuery, statisticsQuery] = useWorkspaceInfo({ refreshStatistics });

	if (!canViewStatistics) {
		return <NotAuthorizedPage />;
	}

	if (serverInfoQuery.isLoading || instancesQuery.isLoading || statisticsQuery.isLoading) {
		return <PageSkeleton />;
	}

	const handleClickRefreshButton = async () => {
		setRefreshStatistics(true);
		statisticsQuery.refetch();
	};

	const handleClickDownloadInfo = (): void => {
		downloadJsonAs(statisticsQuery.data, 'statistics');
	};

	if (serverInfoQuery.isError || instancesQuery.isError || statisticsQuery.isError) {
		return (
			<Page>
				<PageHeader title={t('Workspace')}>
					<ButtonGroup>
						<Button icon='reload' primary type='button' onClick={handleClickRefreshButton} loading={statisticsQuery.isLoading}>
							{t('Refresh')}
						</Button>
					</ButtonGroup>
				</PageHeader>
				<PageScrollableContentWithShadow>
					<Callout type='danger'>{t('Error_loading_pages')}</Callout>
				</PageScrollableContentWithShadow>
			</Page>
		);
	}

	return (
		<WorkspacePage
			canViewStatistics={canViewStatistics}
			serverInfo={serverInfoQuery.data}
			statistics={statisticsQuery.data}
			statisticsIsLoading={statisticsQuery.isLoading}
			instances={instancesQuery.data}
			onClickRefreshButton={handleClickRefreshButton}
			onClickDownloadInfo={handleClickDownloadInfo}
		/>
	);
};

export default memo(WorkspaceRoute);
