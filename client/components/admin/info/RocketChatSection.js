import React from 'react';

import { useTranslation } from '../../../hooks/useTranslation';
import { SkeletonText } from './SkeletonText';
import { formatDate, formatHumanReadableTime } from './formatters';
import { InformationList } from './InformationList';
import { InformationEntry } from './InformationEntry';

export function RocketChatSection({ info, statistics, isLoading }) {
	const s = (fn) => (isLoading ? <SkeletonText /> : fn());
	const t = useTranslation();

	const appsEngineVersion = info && info.marketplaceApiVersion;

	return <>
		<h3>{t('Rocket.Chat')}</h3>
		<InformationList>
			<InformationEntry label={t('Version')}>{s(() => statistics.version)}</InformationEntry>
			{appsEngineVersion && <InformationEntry label={t('Apps_Engine_Version')}>{appsEngineVersion}</InformationEntry>}
			<InformationEntry label={t('DB_Migration')}>{s(() => statistics.migration.version)}</InformationEntry>
			<InformationEntry label={t('DB_Migration_Date')}>{s(() => formatDate(statistics.migration.lockedAt))}</InformationEntry>
			<InformationEntry label={t('Installed_at')}>{s(() => formatDate(statistics.installedAt))}</InformationEntry>
			<InformationEntry label={t('Uptime')}>{s(() => formatHumanReadableTime(statistics.process.uptime, t))}</InformationEntry>
			<InformationEntry label={t('Deployment_ID')}>{s(() => statistics.uniqueId)}</InformationEntry>
			<InformationEntry label={t('PID')}>{s(() => statistics.process.pid)}</InformationEntry>
			<InformationEntry label={t('Running_Instances')}>{s(() => statistics.instanceCount)}</InformationEntry>
			<InformationEntry label={t('OpLog')}>{s(() => (statistics.oplogEnabled ? t('Enabled') : t('Disabled')))}</InformationEntry>
		</InformationList>
	</>;
}
