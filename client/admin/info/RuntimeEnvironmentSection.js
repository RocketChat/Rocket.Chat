import { Skeleton } from '@rocket.chat/fuselage';
import React from 'react';
import s from 'underscore.string';

import Subtitle from '../../components/basic/Subtitle';
import { useTranslation } from '../../contexts/TranslationContext';
import { useFormatMemorySize } from '../../hooks/useFormatMemorySize';
import { useFormatDuration } from '../../hooks/useFormatDuration';
import { DescriptionList } from './DescriptionList';

const formatCPULoad = (load) => {
	if (!load) {
		return null;
	}

	const [oneMinute, fiveMinutes, fifteenMinutes] = load;
	return `${ s.numberFormat(oneMinute, 2) }, ${ s.numberFormat(fiveMinutes, 2) }, ${ s.numberFormat(fifteenMinutes, 2) }`;
};

export function RuntimeEnvironmentSection({ statistics, isLoading }) {
	const s = (fn) => (isLoading ? <Skeleton width='50%' /> : fn());
	const t = useTranslation();
	const formatMemorySize = useFormatMemorySize();
	const formatDuration = useFormatDuration();

	return <DescriptionList
		data-qa='runtime-env-list'
		title={<Subtitle data-qa='runtime-env-title'>{t('Runtime_Environment')}</Subtitle>}
	>
		<DescriptionList.Entry label={t('OS_Type')}>{s(() => statistics.os.type)}</DescriptionList.Entry>
		<DescriptionList.Entry label={t('OS_Platform')}>{s(() => statistics.os.platform)}</DescriptionList.Entry>
		<DescriptionList.Entry label={t('OS_Arch')}>{s(() => statistics.os.arch)}</DescriptionList.Entry>
		<DescriptionList.Entry label={t('OS_Release')}>{s(() => statistics.os.release)}</DescriptionList.Entry>
		<DescriptionList.Entry label={t('Node_version')}>{s(() => statistics.process.nodeVersion)}</DescriptionList.Entry>
		<DescriptionList.Entry label={t('Mongo_version')}>{s(() => statistics.mongoVersion)}</DescriptionList.Entry>
		<DescriptionList.Entry label={t('Mongo_storageEngine')}>{s(() => statistics.mongoStorageEngine)}</DescriptionList.Entry>
		<DescriptionList.Entry label={t('OS_Uptime')}>{s(() => formatDuration(statistics.os.uptime))}</DescriptionList.Entry>
		<DescriptionList.Entry label={t('OS_Loadavg')}>{s(() => formatCPULoad(statistics.os.loadavg))}</DescriptionList.Entry>
		<DescriptionList.Entry label={t('OS_Totalmem')}>{s(() => formatMemorySize(statistics.os.totalmem))}</DescriptionList.Entry>
		<DescriptionList.Entry label={t('OS_Freemem')}>{s(() => formatMemorySize(statistics.os.freemem))}</DescriptionList.Entry>
		<DescriptionList.Entry label={t('OS_Cpus')}>{s(() => statistics.os.cpus.length)}</DescriptionList.Entry>
	</DescriptionList>;
}
