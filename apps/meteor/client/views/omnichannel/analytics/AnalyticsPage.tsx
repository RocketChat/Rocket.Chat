import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Select, Field, FieldLabel, FieldRow, Option } from '@rocket.chat/fuselage';
import { Page, PageHeader, PageScrollableContentWithShadow } from '@rocket.chat/ui-client';
import { useId, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import AgentOverview from './AgentOverview';
import DateRangePicker from './DateRangePicker';
import InterchangeableChart from './InterchangeableChart';
import Overview from './Overview';
import AutoCompleteDepartment from '../components/AutoCompleteDepartment';

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
	const typeField = useId();
	const departmentsLabelId = useId();
	const chartField = useId();

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
			<PageScrollableContentWithShadow display='flex' flexDirection='column' gap={8} paddingBlock={20}>
				<Box display='flex' flexWrap='wrap' flexGrow={1} columnGap={8}>
					<Box display='flex' flexWrap='wrap' flexGrow={1} columnGap={8}>
						<Box flexGrow={1}>
							<Field>
								<FieldLabel htmlFor={typeField}>{t('Type')}</FieldLabel>
								<FieldRow>
									<Select id={typeField} options={typeOptions} value={type} onChange={(value) => setType(String(value))} />
								</FieldRow>
							</Field>
						</Box>
						<Box flexGrow={1}>
							<Field>
								<FieldLabel id={departmentsLabelId}>{t('Departments')}</FieldLabel>
								<FieldRow>
									<AutoCompleteDepartment
										aria-labelledby={departmentsLabelId}
										value={department || undefined}
										onChange={setDepartment}
										onlyMyDepartments
										withTitle={false}
										renderItem={({ label, ...props }) => (
											<Option {...props} label={<span style={{ whiteSpace: 'normal' }}>{label}</span>} />
										)}
									/>
								</FieldRow>
							</Field>
						</Box>
					</Box>
					<DateRangePicker flexGrow={1} onChange={setDateRange} />
				</Box>
				<Box>
					<Overview type={type} dateRange={dateRange} departmentId={department || ''} />
				</Box>
				<Box display='flex' paddingInline='x4'>
					<Field>
						<FieldLabel htmlFor={chartField}>{t('Chart')}</FieldLabel>
						<FieldRow>
							<Select id={chartField} options={graphOptions} value={chartName} onChange={(value) => setChartName(String(value))} />
						</FieldRow>
					</Field>
				</Box>
				<Box display='flex' flexGrow={1} flexShrink={1}>
					<InterchangeableChart
						flexShrink={1}
						width='66%'
						height='100%'
						chartName={chartName || ''}
						departmentId={department || ''}
						dateRange={dateRange}
						alignSelf='stretch'
					/>
					<Box display='flex' width='33%' justifyContent='stretch' padding='x8' marginInlineStart='x4'>
						<AgentOverview type={chartName || ''} dateRange={dateRange} departmentId={department || ''} />
					</Box>
				</Box>
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default AnalyticsPage;
