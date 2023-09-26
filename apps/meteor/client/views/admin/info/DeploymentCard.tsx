import type { IServerInfo, IStats, Serialized } from '@rocket.chat/core-typings';
import { ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { IInstance } from '@rocket.chat/rest-typings';
import { Card, CardBody, CardCol, CardTitle, CardColSection, CardColTitle, CardFooter } from '@rocket.chat/ui-client';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import InstancesModal from './InstancesModal';

type DeploymentCardProps = {
	info: IServerInfo;
	instances: Serialized<IInstance[]>;
	statistics: IStats;
};

const DeploymentCard = ({ info, statistics, instances }: DeploymentCardProps): ReactElement => {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const setModal = useSetModal();

	const { commit = {} } = info;

	const appsEngineVersion = info?.marketplaceApiVersion;

	const handleInstancesModal = useMutableCallback(() => {
		setModal(<InstancesModal instances={instances} onClose={(): void => setModal()} />);
	});

	return (
		<Card data-qa-id='deployment-card'>
			<CardTitle>{t('Deployment')}</CardTitle>
			<CardBody>
				<CardCol>
					<CardColSection>
						<CardColTitle>{t('Version')}</CardColTitle>
						{statistics.version}
					</CardColSection>
					<CardColSection>
						<CardColTitle>{t('Deployment_ID')}</CardColTitle>
						{statistics.uniqueId}
					</CardColSection>
					{appsEngineVersion && (
						<CardColSection>
							<CardColTitle>{t('Apps_Engine_Version')}</CardColTitle>
							{appsEngineVersion}
						</CardColSection>
					)}
					<CardColSection>
						<CardColTitle>{t('Node_version')}</CardColTitle>
						{statistics.process.nodeVersion}
					</CardColSection>
					<CardColSection>
						<CardColTitle>{t('DB_Migration')}</CardColTitle>
						{`${statistics.migration.version} (${formatDateAndTime(statistics.migration.lockedAt)})`}
					</CardColSection>
					<CardColSection>
						<CardColTitle>{t('MongoDB')}</CardColTitle>
						{`${statistics.mongoVersion} / ${statistics.mongoStorageEngine} ${
							!statistics.msEnabled ? `(oplog ${statistics.oplogEnabled ? t('Enabled') : t('Disabled')})` : ''
						}`}
					</CardColSection>
					<CardColSection>
						<CardColTitle>{t('Commit_details')}</CardColTitle>
						{t('github_HEAD')}: ({commit.hash ? commit.hash.slice(0, 9) : ''}) <br />
						{t('Branch')}: {commit.branch} <br />
						{commit.subject}
					</CardColSection>
					<CardColSection>
						<CardColTitle>{t('PID')}</CardColTitle>
						{statistics.process.pid}
					</CardColSection>
				</CardCol>
			</CardBody>

			{!!instances.length && (
				<CardFooter>
					<ButtonGroup align='end'>
						<Button small onClick={handleInstancesModal}>
							{t('Instances')}
						</Button>
					</ButtonGroup>
				</CardFooter>
			)}
		</Card>
	);
};

export default memo(DeploymentCard);
