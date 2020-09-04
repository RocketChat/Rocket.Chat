import React from 'react';

import Subtitle from '../../components/basic/Subtitle';
import { useTranslation } from '../../contexts/TranslationContext';
import { useFormatDateAndTime } from '../../hooks/useFormatDateAndTime';
import { DescriptionList } from './DescriptionList';

export const BuildEnvironmentSection = React.memo(function BuildEnvironmentSection({ info }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const build = info && (info.compile || info.build);

	return <DescriptionList
		data-qa='build-env-list'
		title={<Subtitle data-qa='build-env-title'>{t('Build_Environment')}</Subtitle>}
	>
		<DescriptionList.Entry label={t('OS_Platform')}>{build.platform}</DescriptionList.Entry>
		<DescriptionList.Entry label={t('OS_Arch')}>{build.arch}</DescriptionList.Entry>
		<DescriptionList.Entry label={t('OS_Release')}>{build.osRelease}</DescriptionList.Entry>
		<DescriptionList.Entry label={t('Node_version')}>{build.nodeVersion}</DescriptionList.Entry>
		<DescriptionList.Entry label={t('Date')}>{formatDateAndTime(build.date)}</DescriptionList.Entry>
	</DescriptionList>;
});
