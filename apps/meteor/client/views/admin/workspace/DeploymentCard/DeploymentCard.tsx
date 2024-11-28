import type { IWorkspaceInfo, IStats } from '@rocket.chat/core-typings';
import { Button, Card, CardBody, CardControls, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { IInstance } from '@rocket.chat/rest-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';
import WorkspaceCardSection from '../components/WorkspaceCardSection';
import InstancesModal from './components/InstancesModal';
import WorkspaceCardSectionWithHeader from '../components/WorkspaceCardSectionWithHeader';

type DeploymentCardProps = {
	serverInfo: IWorkspaceInfo;
	instances: IInstance[];
	statistics: IStats;
};

const DeploymentCard = ({ serverInfo: { info, cloudWorkspaceId }, statistics, instances }: DeploymentCardProps): ReactElement => {
	const { t } = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const setModal = useSetModal();

	const { commit = {}, marketplaceApiVersion: appsEngineVersion } = info || {};

	const handleInstancesModal = useMutableCallback(() => {
		setModal(<InstancesModal instances={instances} onClose={(): void => setModal()} />);
	});

	return (
		<Card data-qa-id='deployment-card' height='full'>
			<CardBody flexDirection='column'>
				<WorkspaceCardSectionWithHeader title={t('Deployment')} titleToContentGap={20} />
				<Margins blockEnd={8}>
					<WorkspaceCardSection title={t('Version')} body={statistics.version} />
					<WorkspaceCardSection title={t('Deployment_ID')} body={statistics.uniqueId} />

					{cloudWorkspaceId && <WorkspaceCardSection title={t('Cloud_Workspace_Id')} body={cloudWorkspaceId} />}

					{appsEngineVersion && <WorkspaceCardSection title={t('Apps_Engine_Version')} body={appsEngineVersion} />}
					<WorkspaceCardSection title={t('Node_version')} body={statistics.process.nodeVersion} />
					<WorkspaceCardSection
						title={t('DB_Migration')}
						body={`${statistics.migration.version} (${formatDateAndTime(statistics.migration.lockedAt)})`}
					/>
					<WorkspaceCardSection
						title={t('MongoDB')}
						body={`${statistics.mongoVersion} / ${statistics.mongoStorageEngine} ${
							!statistics.msEnabled ? `(oplog ${statistics.oplogEnabled ? t('Enabled') : t('Disabled')})` : ''
						}`}
					/>
					<WorkspaceCardSection
						title={t('Commit_details')}
						body={
							<>
								{t('github_HEAD')}: ({commit.hash ? commit.hash.slice(0, 9) : ''}) <br />
								{t('Branch')}: {commit.branch} <br />
								{commit.subject}
							</>
						}
					/>
					<WorkspaceCardSection title={t('PID')} body={statistics.process.pid} />
				</Margins>
			</CardBody>

			{!!instances.length && (
				<CardControls>
					<Button medium onClick={handleInstancesModal}>
						{t('Instances')}
					</Button>
				</CardControls>
			)}
		</Card>
	);
};

export default memo(DeploymentCard);
