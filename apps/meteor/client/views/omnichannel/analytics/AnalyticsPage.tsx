import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Select, Margins, Field, FieldLabel, FieldRow, Label, Option } from '@rocket.chat/fuselage';
import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import AgentOverview from './AgentOverview';
import DateRangePicker from './DateRangePicker';
import InterchangeableChart from './InterchangeableChart';
import Overview from './Overview';
import AutoCompleteDepartment from '../../../components/AutoCompleteDepartment';
import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';

const useOptions = (type: string): SelectOption[] => {
	const { t } = useTranslation();
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
	const { t } = useTranslation();
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
			<PageHeader title={t('Analytics')} />
			<PageScrollableContentWithShadow display='flex' flexDirection='column'>
				<Margins block={4}>
					<Box display='flex' mi='neg-x4' flexWrap='wrap' flexGrow={1}>
						<Box display='flex' flexWrap='wrap' flexGrow={1}>
							<Box display='flex' mi={4} flexDirection='column' flexGrow={1}>
								<Label mb={4}>{t('Type')}</Label>
								<Select options={typeOptions} value={type} onChange={(value) => setType(String(value))} />
							</Box>
							<Box display='flex' mi={4} flexDirection='column' flexGrow={1}>
								<Label mb={4}>{t('Departments')}</Label>
								<AutoCompleteDepartment
									value={department || undefined}
									onChange={setDepartment}
									onlyMyDepartments
									withTitle={false}
									renderItem={({ label, ...props }) => <Option {...props} label={<span style={{ whiteSpace: 'normal' }}>{label}</span>} />}
								/>
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
								<FieldLabel>{t('Chart')}</FieldLabel>
								<FieldRow>
									<Select options={graphOptions} value={chartName} onChange={(value) => setChartName(String(value))} />
								</FieldRow>
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
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default AnalyticsPage;
