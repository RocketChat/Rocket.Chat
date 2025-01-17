import { Callout, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import WorkspacePage from './WorkspacePage';
import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';
import PageSkeleton from '../../../components/PageSkeleton';
import { useWorkspaceInfo } from '../../../hooks/useWorkspaceInfo';
import { downloadJsonAs } from '../../../lib/download';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const WorkspaceRoute = (): ReactElement => {
	const { t } = useTranslation();
	const canViewStatistics = usePermission('view-statistics');

	const [refreshStatistics, setRefreshStatistics] = useState(false);
	const [serverInfoQuery, instancesQuery, statisticsQuery] = useWorkspaceInfo({ refreshStatistics });

	if (!canViewStatistics) {
		return <NotAuthorizedPage />;
	}

	if (serverInfoQuery.isPending || instancesQuery.isPending || statisticsQuery.isPending) {
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
						<Button icon='reload' primary type='button' onClick={handleClickRefreshButton} loading={statisticsQuery.isPending}>
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
			statisticsIsLoading={statisticsQuery.isPending}
			instances={instancesQuery.data}
			onClickRefreshButton={handleClickRefreshButton}
			onClickDownloadInfo={handleClickDownloadInfo}
		/>
	);
};

export default memo(WorkspaceRoute);
