import React from 'react';

import { useTranslation } from '../../../hooks/useTranslation';
import { InformationList } from './InformationList';
import { InformationEntry } from './InformationEntry';
import { formatDate } from './formatters';

export function BuildEnvironmentSection({ info }) {
	const t = useTranslation();
	const build = info && (info.compile || info.build);

	return <>
		<h3>{t('Build_Environment')}</h3>
		<InformationList>
			<InformationEntry label={t('OS_Platform')}>{build.platform}</InformationEntry>
			<InformationEntry label={t('OS_Arch')}>{build.arch}</InformationEntry>
			<InformationEntry label={t('OS_Release')}>{build.osRelease}</InformationEntry>
			<InformationEntry label={t('Node_version')}>{build.nodeVersion}</InformationEntry>
			<InformationEntry label={t('Date')}>{formatDate(build.date)}</InformationEntry>
		</InformationList>
	</>;
}
