import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Select, Margins, Option } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useQueryClient } from '@tanstack/react-query';
import type { Key } from 'react';
import { useState, useMemo, useEffect, Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import AutoCompleteDepartment from '../../../components/AutoCompleteDepartment';
import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';
import { getDateRange } from '../../../lib/utils/getDateRange';
import Label from '../components/Label';
import AgentStatusChart from './charts/AgentStatusChart';
import ChatDurationChart from './charts/ChatDurationChart';
import ChatsChart from './charts/ChatsChart';
import ChatsPerAgentChart from './charts/ChatsPerAgentChart';
import ChatsPerDepartmentChart from './charts/ChatsPerDepartmentChart';
import ResponseTimesChart from './charts/ResponseTimesChart';
import AgentsOverview from './overviews/AgentsOverview';
import ChatsOverview from './overviews/ChatsOverview';
import ConversationOverview from './overviews/ConversationOverview';
import ProductivityOverview from './overviews/ProductivityOverview';
import { omnichannelQueryKeys } from '../../../lib/queryKeys';

const dateRange = getDateRange();

const RealTimeMonitoringPage = () => {
	const { t } = useTranslation();

	const [reloadFrequency, setReloadFrequency] = useState(60);
	const [departmentId, setDepartment] = useState('');

	const queryClient = useQueryClient();

	const reloadCharts = useEffectEvent(() => {
		queryClient.invalidateQueries({ queryKey: omnichannelQueryKeys.analytics.all(departmentId) });
	});

	useEffect(() => {
		const interval = setInterval(reloadCharts, reloadFrequency * 1000);

		return () => {
			clearInterval(interval);
		};
	}, [reloadCharts, reloadFrequency]);

	const reloadOptions = useMemo(
		() => [
			[60, <Fragment key='1 minute'>1 {t('minute')}</Fragment>] as unknown as SelectOption,
			[120, <Fragment key='2 minutes'>2 {t('minutes')}</Fragment>] as unknown as SelectOption,
			[300, <Fragment key='5 minutes'>5 {t('minutes')}</Fragment>] as unknown as SelectOption,
			[600, <Fragment key='30 seconds'>10 {t('minutes')}</Fragment>] as unknown as SelectOption,
		],
		[t],
	);

	return (
		<Page>
			<PageHeader title={t('Real_Time_Monitoring')} />
			<PageScrollableContentWithShadow>
				<Margins block='x4'>
					<Box flexDirection='row' display='flex' justifyContent='space-between' alignSelf='center' w='full'>
						<Box maxWidth='50%' display='flex' mi={4} flexGrow={1} flexDirection='column'>
							<Label mb={4}>{t('Departments')}</Label>
							<AutoCompleteDepartment
								value={departmentId}
								onChange={setDepartment}
								placeholder={t('All')}
								label={t('All')}
								onlyMyDepartments
								withTitle={false}
								renderItem={({ label, ...props }) => <Option {...props} label={<span style={{ whiteSpace: 'normal' }}>{label}</span>} />}
							/>
						</Box>
						<Box maxWidth='50%' display='flex' mi={4} flexGrow={1} flexDirection='column'>
							<Label mb={4}>{t('Update_every')}</Label>
							<Select
								options={reloadOptions}
								onChange={useEffectEvent((val: Key) => setReloadFrequency(val as number))}
								value={reloadFrequency}
							/>
						</Box>
					</Box>
					<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
						<ConversationOverview flexGrow={1} flexShrink={1} width='50%' departmentId={departmentId} dateRange={dateRange} />
					</Box>
					<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
						<ChatsChart flexGrow={1} flexShrink={1} width='50%' mie={2} departmentId={departmentId} dateRange={dateRange} />
						<ChatsPerAgentChart flexGrow={1} flexShrink={1} width='50%' mis={2} departmentId={departmentId} dateRange={dateRange} />
					</Box>
					<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
						<ChatsOverview flexGrow={1} flexShrink={1} width='50%' departmentId={departmentId} dateRange={dateRange} />
					</Box>
					<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
						<AgentStatusChart flexGrow={1} flexShrink={1} width='50%' mie={2} departmentId={departmentId} />
						<ChatsPerDepartmentChart flexGrow={1} flexShrink={1} width='50%' mis={2} departmentId={departmentId} dateRange={dateRange} />
					</Box>
					<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
						<AgentsOverview flexGrow={1} flexShrink={1} departmentId={departmentId} dateRange={dateRange} />
					</Box>
					<Box display='flex' w='full' flexShrink={1}>
						<ChatDurationChart flexGrow={1} flexShrink={1} w='100%' departmentId={departmentId} dateRange={dateRange} />
					</Box>
					<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
						<ProductivityOverview flexGrow={1} flexShrink={1} departmentId={departmentId} dateRange={dateRange} />
					</Box>
					<Box display='flex' w='full' flexShrink={1}>
						<ResponseTimesChart flexGrow={1} flexShrink={1} w='100%' departmentId={departmentId} dateRange={dateRange} />
					</Box>
				</Margins>
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default RealTimeMonitoringPage;
