import type { IWorkspaceInfo, IStats } from '@rocket.chat/core-typings';
import { Button, ButtonGroup, Callout, CardGrid, Stack } from '@rocket.chat/fuselage';
import type { IInstance } from '@rocket.chat/rest-typings';
import { Page, PageHeader, PageScrollableContentWithShadow, useIsEnterprise } from '@rocket.chat/ui-client';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import DeploymentCard from './DeploymentCard/DeploymentCard';
import MessagesRoomsCard from './MessagesRoomsCard/MessagesRoomsCard';
import UsersUploadsCard from './UsersUploadsCard/UsersUploadsCard';
import VersionCard from './VersionCard/VersionCard';

type WorkspaceStatusPageProps = {
	canViewStatistics: boolean;
	serverInfo: IWorkspaceInfo;
	statistics: IStats;
	statisticsIsLoading: boolean;
	instances: IInstance[];
	onClickRefreshButton: () => void;
	onClickDownloadInfo: () => void;
};

const WorkspacePage = ({
	canViewStatistics,
	serverInfo,
	statistics,
	statisticsIsLoading,
	instances,
	onClickRefreshButton,
	onClickDownloadInfo,
}: WorkspaceStatusPageProps) => {
	const { t } = useTranslation();

	const { data } = useIsEnterprise();

	const warningMultipleInstances = !data?.isEnterprise && !statistics?.msEnabled && statistics?.instanceCount > 1;

	return (
		<Page background='tint'>
			<PageHeader title={t('Workspace')}>
				{canViewStatistics && (
					<ButtonGroup>
						<Button onClick={onClickDownloadInfo}>{t('Download_Info')}</Button>
						<Button onClick={onClickRefreshButton} loading={statisticsIsLoading}>
							{t('Refresh')}
						</Button>
					</ButtonGroup>
				)}
			</PageHeader>

			<PageScrollableContentWithShadow padding='x24'>
				<Stack gap='x16'>
					{warningMultipleInstances && <Callout type='warning' title={t('Multiple_monolith_instances_alert')}></Callout>}
					<VersionCard serverInfo={serverInfo} />
					<CardGrid breakpoints={{ lg: 4, xs: 4 }}>
						<DeploymentCard serverInfo={serverInfo} statistics={statistics} instances={instances} />
						<UsersUploadsCard statistics={statistics} />
						<MessagesRoomsCard statistics={statistics} />
					</CardGrid>
				</Stack>
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default memo(WorkspacePage);
