import { Skeleton } from '@rocket.chat/fuselage';
import React from 'react';

import Subtitle from '../../components/basic/Subtitle';
import { useTranslation } from '../../contexts/TranslationContext';
import { useFormatDateAndTime } from '../../hooks/useFormatDateAndTime';
import { useFormatDuration } from '../../hooks/useFormatDuration';
import { DescriptionList } from './DescriptionList';

export function RocketChatSection({ info, statistics, isLoading }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const formatDuration = useFormatDuration();

	const s = (fn) => (isLoading ? <Skeleton width='50%' /> : fn());

	const appsEngineVersion = info && info.marketplaceApiVersion;

	return <DescriptionList
		data-qa='rocket-chat-list'
		title={<Subtitle data-qa='rocket-chat-title'>{t('Rocket.Chat')}</Subtitle>}
	>
		<DescriptionList.Entry label={t('Version')}>{s(() => statistics.version)}</DescriptionList.Entry>
		{appsEngineVersion && <DescriptionList.Entry label={t('Apps_Engine_Version')}>{appsEngineVersion}</DescriptionList.Entry>}
		<DescriptionList.Entry label={t('DB_Migration')}>{s(() => statistics.migration.version)}</DescriptionList.Entry>
		<DescriptionList.Entry label={t('DB_Migration_Date')}>{s(() => formatDateAndTime(statistics.migration.lockedAt))}</DescriptionList.Entry>
		<DescriptionList.Entry label={t('Installed_at')}>{s(() => formatDateAndTime(statistics.installedAt))}</DescriptionList.Entry>
		<DescriptionList.Entry label={t('Uptime')}>{s(() => formatDuration(statistics.process.uptime))}</DescriptionList.Entry>
		<DescriptionList.Entry label={t('Deployment_ID')}>{s(() => statistics.uniqueId)}</DescriptionList.Entry>
		<DescriptionList.Entry label={t('PID')}>{s(() => statistics.process.pid)}</DescriptionList.Entry>
		<DescriptionList.Entry label={t('Running_Instances')}>{s(() => statistics.instanceCount)}</DescriptionList.Entry>
		<DescriptionList.Entry label={t('OpLog')}>{s(() => (statistics.oplogEnabled ? t('Enabled') : t('Disabled')))}</DescriptionList.Entry>
	</DescriptionList>;
}
