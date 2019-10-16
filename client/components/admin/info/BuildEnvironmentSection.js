import React from 'react';

import { useTranslation } from '../../../hooks/useTranslation';
import { DescriptionList } from './DescriptionList';
import { formatDate } from './formatters';

export function BuildEnvironmentSection({ info }) {
	const t = useTranslation();
	const build = info && (info.compile || info.build);

	return <>
		<h3>{t('Build_Environment')}</h3>
		<DescriptionList>
			<DescriptionList.Entry label={t('OS_Platform')}>{build.platform}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('OS_Arch')}>{build.arch}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('OS_Release')}>{build.osRelease}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Node_version')}>{build.nodeVersion}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Date')}>{formatDate(build.date)}</DescriptionList.Entry>
		</DescriptionList>
	</>;
}
