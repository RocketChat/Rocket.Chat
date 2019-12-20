import { Subtitle } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import { DescriptionList } from './DescriptionList';
import { formatDate } from './formatters';

export function BuildEnvironmentSection({ info }) {
	const t = useTranslation();
	const build = info && (info.compile || info.build);

	return <>
		<Subtitle>{t('Build_Environment')}</Subtitle>
		<DescriptionList>
			<DescriptionList.Entry label={t('OS_Platform')}>{build.platform}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('OS_Arch')}>{build.arch}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('OS_Release')}>{build.osRelease}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Node_version')}>{build.nodeVersion}</DescriptionList.Entry>
			<DescriptionList.Entry label={t('Date')}>{formatDate(build.date)}</DescriptionList.Entry>
		</DescriptionList>
	</>;
}
