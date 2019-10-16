import React from 'react';

import { useTranslation } from '../../../hooks/useTranslation';
import { SkeletonText } from './SkeletonText';
import { formatMemorySize, formatHumanReadableTime, formatCPULoad } from './formatters';
import { InformationList } from './InformationList';
import { InformationEntry } from './InformationEntry';

export function RuntimeEnvironmentSection({ statistics, isLoading }) {
	const s = (fn) => (isLoading ? <SkeletonText /> : fn());
	const t = useTranslation();

	return <>
		<h3>{t('Runtime_Environment')}</h3>
		<InformationList>
			<InformationEntry label={t('OS_Type')}>{s(() => statistics.os.type)}</InformationEntry>
			<InformationEntry label={t('OS_Platform')}>{s(() => statistics.os.platform)}</InformationEntry>
			<InformationEntry label={t('OS_Arch')}>{s(() => statistics.os.arch)}</InformationEntry>
			<InformationEntry label={t('OS_Release')}>{s(() => statistics.os.release)}</InformationEntry>
			<InformationEntry label={t('Node_version')}>{s(() => statistics.process.nodeVersion)}</InformationEntry>
			<InformationEntry label={t('Mongo_version')}>{s(() => statistics.mongoVersion)}</InformationEntry>
			<InformationEntry label={t('Mongo_storageEngine')}>{s(() => statistics.mongoStorageEngine)}</InformationEntry>
			<InformationEntry label={t('OS_Uptime')}>{s(() => formatHumanReadableTime(statistics.os.uptime, t))}</InformationEntry>
			<InformationEntry label={t('OS_Loadavg')}>{s(() => formatCPULoad(statistics.os.loadavg))}</InformationEntry>
			<InformationEntry label={t('OS_Totalmem')}>{s(() => formatMemorySize(statistics.os.totalmem))}</InformationEntry>
			<InformationEntry label={t('OS_Freemem')}>{s(() => formatMemorySize(statistics.os.freemem))}</InformationEntry>
			<InformationEntry label={t('OS_Cpus')}>{s(() => statistics.os.cpus.length)}</InformationEntry>
		</InformationList>
	</>;
}
