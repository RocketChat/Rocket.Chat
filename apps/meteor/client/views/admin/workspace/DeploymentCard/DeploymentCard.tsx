import type { IWorkspaceInfo, IStats } from '@rocket.chat/core-typings';
import { Button, Card, CardBody, CardControls, Text } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { IInstance } from '@rocket.chat/rest-typings';
import { useFormatDateAndTime } from '@rocket.chat/ui-client';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import InstancesModal from './components/InstancesModal';
import WorkspaceCardDetail from '../components/WorkspaceCardDetail';
import WorkspaceCardSectionTitle from '../components/WorkspaceCardSectionTitle';
import WorkspaceCardSections from '../layout/WorkspaceCardSections';

export type DeploymentCardProps = {
	serverInfo: IWorkspaceInfo;
	instances: IInstance[];
	statistics: IStats;
};

const DeploymentCard = ({
	serverInfo: { info, cloudWorkspaceId, workspaceUrl, hashedWorkspaceUrl },
	statistics,
	instances,
}: DeploymentCardProps) => {
	const { t } = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const setModal = useSetModal();

	const { commit = {}, marketplaceApiVersion: appsEngineVersion } = info || {};

	const handleInstancesModal = useStableCallback(() => {
		setModal(<InstancesModal instances={instances} onClose={(): void => setModal()} />);
	});

	return (
		<Card>
			<CardBody flexDirection='column'>
				<WorkspaceCardSectionTitle title={t('Deployment')} variant='h4' />
				<WorkspaceCardSections gap='x16' spaceAbove='x20' spaceBelow='x8'>
					<WorkspaceCardDetail label={t('Version')}>{statistics.version}</WorkspaceCardDetail>
					{workspaceUrl && <WorkspaceCardDetail label={t('Site_Url')}>{workspaceUrl}</WorkspaceCardDetail>}
					{hashedWorkspaceUrl && (
						<WorkspaceCardDetail label={t('Hashed_Site_Url')}>
							<Text is='span' style={{ lineBreak: 'anywhere' }}>
								{hashedWorkspaceUrl}
							</Text>
						</WorkspaceCardDetail>
					)}
					<WorkspaceCardDetail label={t('Deployment_ID')}>{statistics.uniqueId}</WorkspaceCardDetail>

					{cloudWorkspaceId && <WorkspaceCardDetail label={t('Cloud_Workspace_Id')}>{cloudWorkspaceId}</WorkspaceCardDetail>}

					{appsEngineVersion && <WorkspaceCardDetail label={t('Apps_Engine_Version')}>{appsEngineVersion}</WorkspaceCardDetail>}
					<WorkspaceCardDetail label={t('Node_version')}>{statistics.process.nodeVersion}</WorkspaceCardDetail>
					<WorkspaceCardDetail label={t('DB_Migration')}>
						{`${statistics.migration.version} (${formatDateAndTime(statistics.migration.lockedAt)})`}
					</WorkspaceCardDetail>
					<WorkspaceCardDetail label={t('MongoDB')}>{`${statistics.mongoVersion} / ${statistics.mongoStorageEngine}`}</WorkspaceCardDetail>
					<WorkspaceCardDetail label={t('Commit_details')}>
						{t('github_HEAD')}: ({commit.hash ? commit.hash.slice(0, 9) : ''}) <br />
						{t('Branch')}: {commit.branch} <br />
						{commit.subject}
					</WorkspaceCardDetail>
					<WorkspaceCardDetail label={t('PID')}>{statistics.process.pid}</WorkspaceCardDetail>
				</WorkspaceCardSections>
			</CardBody>

			{!!instances.length && (
				<CardControls>
					<Button size='medium' onClick={handleInstancesModal}>
						{t('Instances')}
					</Button>
				</CardControls>
			)}
		</Card>
	);
};

export default memo(DeploymentCard);
