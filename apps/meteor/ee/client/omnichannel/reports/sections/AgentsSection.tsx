import { Box, Flex } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { AgentsTable, BarChart, ReportCard } from '../components';
import { useAgentsSection } from '../hooks';

export const AgentsSection = () => {
	const t = useTranslation();
	const { data, periodSelectorProps } = useAgentsSection();

	return (
		<ReportCard title={t('Conversations_by_agents')} periodSelectorProps={periodSelectorProps} data={data}>
			<Box display='flex' style={{ gap: '16px' }}>
				<Flex.Item grow={1}>
					<BarChart
						data={data.reverse()}
						maxWidth='50%'
						height={360}
						indexBy='label'
						keys={['value']}
						margins={{ top: 20, right: 0, bottom: 50, left: 50 }}
					/>
				</Flex.Item>
				<Flex.Item grow={1}>
					<AgentsTable data={data} />
				</Flex.Item>
			</Box>
		</ReportCard>
	);
};
