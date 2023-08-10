import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { PieChart, ReportCard } from '../components';
import { useChannelsSection } from '../hooks';

export const ChannelsSection = () => {
	const t = useTranslation();
	const { data, periodSelectorProps } = useChannelsSection();

	return (
		<ReportCard title={t('Conversations_by_channel')} periodSelectorProps={periodSelectorProps} data={data}>
			<PieChart data={data} width={300} height={200} />
		</ReportCard>
	);
};
