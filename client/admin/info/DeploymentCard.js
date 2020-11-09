import React from 'react';
import { Skeleton } from '@rocket.chat/fuselage';

import Card from '../../components/basic/Card/Card';
import { useTranslation } from '../../contexts/TranslationContext';
import { useFormatDateAndTime } from '../../hooks/useFormatDateAndTime';

const DeploymentCard = React.memo(function DeploymentCard({ info, statistics, isLoading }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	const { commit = {} } = info;

	const s = (fn) => (isLoading ? <Skeleton width='50%' /> : fn());

	const appsEngineVersion = info && info.marketplaceApiVersion;

	return <Card>
		<Card.Title>{t('Deployment')}</Card.Title>
		<Card.Body>
			<Card.Col>
				<Card.Col.Section>
					<Card.Col.Title>{t('Version')}</Card.Col.Title>
					{s(() => statistics.version)}
				</Card.Col.Section>
				<Card.Col.Section>
					<Card.Col.Title>{t('Deployment_ID')}</Card.Col.Title>
					{s(() => statistics.uniqueId)}
				</Card.Col.Section>
				{appsEngineVersion && <Card.Col.Section>
					<Card.Col.Title>{t('Apps_Engine_Version')}</Card.Col.Title>
					{appsEngineVersion}
				</Card.Col.Section>}
				<Card.Col.Section>
					<Card.Col.Title>{t('Node_version')}</Card.Col.Title>
					{s(() => statistics.process.nodeVersion)}
				</Card.Col.Section>
				<Card.Col.Section>
					<Card.Col.Title>{t('DB_Migration')}</Card.Col.Title>
					{s(() => `${ statistics.migration.version } (${ formatDateAndTime(statistics.migration.lockedAt) }`)}
				</Card.Col.Section>
				<Card.Col.Section>
					<Card.Col.Title>{t('MongoDB')}</Card.Col.Title>
					{s(() => `${ statistics.mongoVersion } / ${ statistics.mongoStorageEngine } (oplog ${ statistics.oplogEnabled ? t('Enabled') : t('Disabled') })`)}
				</Card.Col.Section>
				<Card.Col.Section>
					<Card.Col.Title>{t('Commit_details')}</Card.Col.Title>
					{t('HEAD')}: ({s(() => commit.hash.slice(0, 9))}) <br />
					{t('Branch')}: {s(() => commit.branch)}
				</Card.Col.Section>
				<Card.Col.Section>
					<Card.Col.Title>{t('PID')}</Card.Col.Title>
					{s(() => statistics.process.pid)}
				</Card.Col.Section>
			</Card.Col>
		</Card.Body>
	</Card>;
});

export default DeploymentCard;
