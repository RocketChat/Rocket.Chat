import React, { useMemo, useState, useEffect } from 'react';
import { Box, Select, Margins } from '@rocket.chat/fuselage';

import DepartmentAutoComplete from '../DepartmentAutoComplete';
import DateRangePicker from './DateRangePicker';
import Overview from './Overview';
import AgentOverview from './AgentOverview';
import Page from '../../components/basic/Page';
import InterchangeableChart from './InterchangeableChart';
import { useTranslation } from '../../contexts/TranslationContext';

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

const border = {
	borderStyle: 'solid',
	borderWidth: 'x2',
	borderRadius: 'x2',
	borderColor: 'neutral-300',
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
				<Box display='flex' flexDirection='row' justifyContent='space-between'>
					<Box mi='neg-x4'>
						<Margins inline='x4'>
							<Select options={typeOptions} value={type} onChange={setType} />
							<DepartmentAutoComplete value={departmentId} onChange={setDepartmentId}/>
						</Margins>
					</Box>
					<DateRangePicker onChange={setDateRange}/>
				</Box>
				<Overview type={type} dateRange={dateRange} departmentId={departmentId}/>
				<Box display='flex' flexDirection='row' flexGrow={1}>
					<Box
						display='flex'
						flexDirection='column'
						alignItems='stretch'
						justifyContent='flex-start'
						flexShrink={1}
						flexBasis='100%'
						mie='x4'
						{...border}
					>
						<Select options={graphOptions} value={chartName} onChange={setChartName} flexGrow={0}/>
						<InterchangeableChart flexGrow={1} chartName={chartName} departmentId={departmentId} dateRange={dateRange}/>
					</Box>
					<Box
						display='flex'
						flexShrink={2}
						flexDirection='row'
						justifyContent='stretch'
						flexBasis='100%'
						p='x10'
						mis='x4'
						{...border}
					>
						<AgentOverview type={chartName} dateRange={dateRange} departmentId={departmentId}/>
					</Box>
				</Box>
			</Margins>
		</Page.ScrollableContentWithShadow>
	</Page>;
};

export default AnalyticsPage;
