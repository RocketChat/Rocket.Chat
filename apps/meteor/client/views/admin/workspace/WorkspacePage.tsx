import type { IWorkspaceInfo, IStats } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, Callout, CardGrid } from '@rocket.chat/fuselage';
import type { IInstance } from '@rocket.chat/rest-typings';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import DeploymentCard from './DeploymentCard/DeploymentCard';
import MessagesRoomsCard from './MessagesRoomsCard/MessagesRoomsCard';
import UsersUploadsCard from './UsersUploadsCard/UsersUploadsCard';
import VersionCard from './VersionCard/VersionCard';
import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';

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
	const alertOplogForMultipleInstances = warningMultipleInstances && !statistics.oplogEnabled;

	return (
		<Page bg='tint'>
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

			<PageScrollableContentWithShadow p={16}>
				<Box marginBlock='none' marginInline='auto' width='full' color='default'>
					{warningMultipleInstances && (
						<Callout type='warning' title={t('Multiple_monolith_instances_alert')} marginBlockEnd={16}></Callout>
					)}
					{alertOplogForMultipleInstances && (
						<Callout
							type='danger'
							title={t('Error_RocketChat_requires_oplog_tailing_when_running_in_multiple_instances')}
							marginBlockEnd={16}
						>
							<Box withRichContent>
								<p>{t('Error_RocketChat_requires_oplog_tailing_when_running_in_multiple_instances_details')}</p>
								<p>
									<a
										rel='noopener noreferrer'
										target='_blank'
										href={
											'https://rocket.chat/docs/installation/manual-installation/multiple-instances-to-improve-' +
											'performance/#running-multiple-instances-per-host-to-improve-performance'
										}
									>
										{t('Click_here_for_more_info')}
									</a>
								</p>
							</Box>
						</Callout>
					)}
					<Box mbe={16}>
						<VersionCard serverInfo={serverInfo} />
					</Box>
					<CardGrid breakpoints={{ lg: 4, xs: 4, p: 8 }}>
						<DeploymentCard serverInfo={serverInfo} statistics={statistics} instances={instances} />
						<UsersUploadsCard statistics={statistics} />
						<MessagesRoomsCard statistics={statistics} />
					</CardGrid>
				</Box>
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default memo(WorkspacePage);
