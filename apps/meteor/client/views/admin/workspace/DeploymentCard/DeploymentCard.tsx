import type { IWorkspaceInfo, IStats } from '@rocket.chat/core-typings';
import { Button, Card, CardBody, CardControls, Margins } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { IInstance } from '@rocket.chat/rest-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';
import WorkspaceCardSection from '../components/WorkspaceCardSection';
import InstancesModal from './components/InstancesModal';
import WorkspaceCardSectionTitle from '../components/WorkspaceCardSectionTitle';

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
	const processInfo = statistics?.process ?? {};
	const migrationInfo = statistics?.migration ?? {};
	const mongoVersion = statistics?.mongoVersion ?? '-';
	const mongoEngine = statistics?.mongoStorageEngine ?? '-';
	const oplogStatus = statistics?.oplogEnabled ? t('Enabled') : t('Disabled');

	const handleInstancesModal = useEffectEvent(() => {
		setModal(<InstancesModal instances={instances} onClose={(): void => setModal()} />);
	});

	return (
		<Card height='full'>
			<CardBody flexDirection='column'>
				<WorkspaceCardSection>
					<WorkspaceCardSectionTitle title={t('Deployment')} variant='h4' />
				</WorkspaceCardSection>
				<Margins blockEnd={8}>
					<WorkspaceCardSection>
						<WorkspaceCardSectionTitle title={t('Version')} />
						{statistics.version}
					</WorkspaceCardSection>
					<WorkspaceCardSection>
						<WorkspaceCardSectionTitle title={t('Deployment_ID')} />
						{statistics.uniqueId}
					</WorkspaceCardSection>

					{cloudWorkspaceId && (
						<WorkspaceCardSection>
							<WorkspaceCardSectionTitle title={t('Cloud_Workspace_Id')} />
							{cloudWorkspaceId}
						</WorkspaceCardSection>
					)}

					{appsEngineVersion && (
						<WorkspaceCardSection>
							<WorkspaceCardSectionTitle title={t('Apps_Engine_Version')} />
							{appsEngineVersion}
						</WorkspaceCardSection>
					)}
					<WorkspaceCardSection>
						<WorkspaceCardSectionTitle title={t('Node_version')} />
						{processInfo.nodeVersion ?? '-'}
					</WorkspaceCardSection>
					<WorkspaceCardSection>
						<WorkspaceCardSectionTitle title={t('DB_Migration')} />
						{migrationInfo.version
							? `${migrationInfo.version} (${formatDateAndTime(migrationInfo.lockedAt)})`
							: '-'}
					</WorkspaceCardSection>
					<WorkspaceCardSection>
						<WorkspaceCardSectionTitle title={t('MongoDB')} />
						{`${mongoVersion} / ${mongoEngine} ${!statistics.msEnabled ? `(oplog ${oplogStatus})` : ''}`}
					</WorkspaceCardSection>
					<WorkspaceCardSection>
						<WorkspaceCardSectionTitle title={t('Commit_details')} />
						{t('github_HEAD')}: ({commit.hash ? commit.hash.slice(0, 9) : ''}) <br />
						{t('Branch')}: {commit.branch} <br />
						{commit.subject}
					</WorkspaceCardSection>
					<WorkspaceCardSection>
						<WorkspaceCardSectionTitle title={t('PID')} />
						{processInfo.pid ?? '-'}
					</WorkspaceCardSection>
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
