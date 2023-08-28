import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Select, Margins, Field, Label } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useState, useEffect } from 'react';

import AutoCompleteDepartment from '../../../components/AutoCompleteDepartment';
import Page from '../../../components/Page';
import AgentOverview from './AgentOverview';
import DateRangePicker from './DateRangePicker';
import InterchangeableChart from './InterchangeableChart';
import Overview from './Overview';

const useOptions = (type: string): SelectOption[] => {
	const t = useTranslation();
	return useMemo(() => {
		if (type === 'Conversations') {
			return [
				['Total_conversations', t('Total_conversations')],
				['Avg_chat_duration', t('Avg_chat_duration')],
				['Total_messages', t('Total_messages')],
			];
		}
		return [
			['Avg_first_response_time', t('Avg_first_response_time')],
			['Best_first_response_time', t('Best_first_response_time')],
			['Avg_response_time', t('Avg_response_time')],
			['Avg_reaction_time', t('Avg_reaction_time')],
		];
	}, [t, type]);
};

const AnalyticsPage = () => {
	const t = useTranslation();
	const [type, setType] = useState('Conversations');
	const [department, setDepartment] = useState<string | null>(null);
	const [dateRange, setDateRange] = useState({ start: '', end: '' });
	const [chartName, setChartName] = useState<string | undefined>();

	const typeOptions: SelectOption[] = useMemo(
		() => [
			['Conversations', t('Conversations')],
			['Productivity', t('Productivity')],
		],
		[t],
	);

	const graphOptions: SelectOption[] = useOptions(type);

	useEffect(() => {
		setChartName(graphOptions[0][0]);
	}, [graphOptions]);

	return (
		<Page>
			<Page.Header title={t('Analytics')} />
			<Page.ScrollableContentWithShadow display='flex' flexDirection='column'>
				<Margins block={4}>
					<Box display='flex' mi='neg-x4' flexWrap='wrap' flexGrow={1}>
						<Box display='flex' flexWrap='wrap' flexGrow={1}>
							<Box display='flex' mi={4} flexDirection='column' flexGrow={1}>
								<Label mb={4}>{t('Type')}</Label>
								<Select options={typeOptions} value={type} onChange={setType} />
							</Box>
							<Box display='flex' mi={4} flexDirection='column' flexGrow={1}>
								<Label mb={4}>{t('Departments')}</Label>
								<AutoCompleteDepartment value={department || undefined} onChange={setDepartment} onlyMyDepartments />
							</Box>
						</Box>
						<DateRangePicker flexGrow={1} mi={4} onChange={setDateRange} />
					</Box>
					<Box>
						<Overview type={type} dateRange={dateRange} departmentId={department || ''} />
					</Box>
					<Box display='flex'>
						<Margins inline={2}>
							<Field>
								<Field.Label>{t('Chart')}</Field.Label>
								<Field.Row>
									<Select options={graphOptions} value={chartName} onChange={setChartName} />
								</Field.Row>
							</Field>
						</Margins>
					</Box>
					<Box display='flex' flexGrow={1} flexShrink={1}>
						<InterchangeableChart
							flexShrink={1}
							w='66%'
							h='100%'
							chartName={chartName || ''}
							departmentId={department || ''}
							dateRange={dateRange}
							alignSelf='stretch'
						/>
						<Box display='flex' w='33%' justifyContent='stretch' p={10} mis={4}>
							<AgentOverview type={chartName || ''} dateRange={dateRange} departmentId={department || ''} />
						</Box>
					</Box>
				</Margins>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default AnalyticsPage;
