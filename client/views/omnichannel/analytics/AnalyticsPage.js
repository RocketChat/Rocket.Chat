import React, { useMemo, useState, useEffect } from 'react';
import { Box, Select, Margins, Field, Label } from '@rocket.chat/fuselage';

import DepartmentAutoComplete from '../DepartmentAutoComplete';
import DateRangePicker from './DateRangePicker';
import Overview from './Overview';
import AgentOverview from './AgentOverview';
import Page from '../../../components/Page';
import InterchangeableChart from './InterchangeableChart';
import { useTranslation } from '../../../contexts/TranslationContext';

const useOptions = (type) => {
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
	const [departmentId, setDepartmentId] = useState(null);
	const [dateRange, setDateRange] = useState({ start: null, end: null });
	const [chartName, setChartName] = useState();

	const typeOptions = useMemo(() => [
		['Conversations', t('Conversations')],
		['Productivity', t('Productivity')],
	], [t]);

	const graphOptions = useOptions(type);

	useEffect(() => {
		setChartName(graphOptions[0][0]);
	}, [graphOptions]);

	return <Page>
		<Page.Header title={t('Analytics')}/>
		<Page.ScrollableContentWithShadow display='flex' flexDirection='column'>
			<Margins block='x4'>
				<Box display='flex' mi='neg-x4' flexDirection='row' flexWrap='wrap' >
					<Box display='flex' mi='x4' flexGrow={1} flexDirection='column'>
						<Label mb='x4' >{t('Type')}</Label>
						<Select flexShrink={0} options={typeOptions} value={type} onChange={setType} />
					</Box>
					<Box display='flex' mi='x4' flexGrow={1} flexDirection='column'>
						<Label mb='x4'>{t('Departments')}</Label>
						<DepartmentAutoComplete flexShrink={0} placeholder={t('All')} value={departmentId} onChange={setDepartmentId}/>
					</Box>
					<DateRangePicker mi='x4' flexGrow={1} onChange={setDateRange}/>
				</Box>
				<Box>
					<Overview type={type} dateRange={dateRange} departmentId={departmentId}/>
				</Box>
				<Box display='flex' flexDirection='row'>
					<Margins inline='x2'>
						<Field>
							<Field.Label>{t('Chart')}</Field.Label>
							<Field.Row>
								<Select options={graphOptions} value={chartName} onChange={setChartName}/>
							</Field.Row>
						</Field>
					</Margins>
				</Box>
				<Box display='flex' flexDirection='row' flexGrow={1} flexShrink={1}>
					<InterchangeableChart flexShrink={1} w='66%' h='100%' chartName={chartName} departmentId={departmentId} dateRange={dateRange} alignSelf='stretch'/>
					<Box
						display='flex'
						w='33%'
						flexDirection='row'
						justifyContent='stretch'
						p='x10'
						mis='x4'
					>
						<AgentOverview type={chartName} dateRange={dateRange} departmentId={departmentId}/>
					</Box>
				</Box>
			</Margins>
		</Page.ScrollableContentWithShadow>
	</Page>;
};

export default AnalyticsPage;
