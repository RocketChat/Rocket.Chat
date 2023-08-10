import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { BarChart, ReportCard } from '../components';
import { useTagsSection } from '../hooks';

export const TagsSection = () => {
	const t = useTranslation();
	const { data, periodSelectorProps } = useTagsSection();

	return (
		<ReportCard title={t('Conversations_by_tags')} periodSelectorProps={periodSelectorProps} data={data}>
			<BarChart data={data} direction='horizontal' height={360} margins={{ top: 0, right: 0, bottom: 0, left: 90 }} />
		</ReportCard>
	);
};
