import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Box, Select, Field, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import Page from '../../../components/Page';
import ChatsChart from './charts/ChatsChart';
import ChatsPerAgentChart from './charts/ChatsPerAgentChart';
import AgentStatusChart from './charts/AgentStatusChart';
import ChatsPerDepartmentChart from './charts/ChatsPerDepartmentChart';
import ChatDurationChart from './charts/ChatDurationChart';
import ResponseTimesChart from './charts/ResponseTimesChart';
import ConversationOverview from './overviews/ConversationOverview';
import AgentsOverview from './overviews/AgentsOverview';
import ChatsOverview from './overviews/ChatsOverview';
import ProductivityOverview from './overviews/ProductivityOverview';
import DepartmentAutoComplete from '../DepartmentAutoComplete';
import { getDateRange } from '../../../lib/getDateRange';
import { useTranslation } from '../../../contexts/TranslationContext';

const dateRange = getDateRange();

const RealTimeMonitoringPage = () => {
	const t = useTranslation();

	const [reloadFrequency, setReloadFrequency] = useState(5);
	const [department, setDepartment] = useState('');

	const reloadRef = useRef({});

	const departmentParams = useMemo(() => ({
		...department && { departmentId: department },
	}), [department]);

	const allParams = useMemo(() => ({
		...departmentParams,
		...dateRange,
	}), [departmentParams]);

	const reloadCharts = useMutableCallback(() => {
		Object.values(reloadRef.current).forEach((reload) => {
			reload();
		});
	});

	useEffect(() => {
		const interval = setInterval(reloadCharts, reloadFrequency * 1000);
		return () => {
			clearInterval(interval);
		};
	}, [reloadCharts, reloadFrequency]);

	const reloadOptions = useMemo(() => [
		[5, <>5 {t('seconds')}</>],
		[10, <>10 {t('seconds')}</>],
		[30, <>30 {t('seconds')}</>],
		[60, <>1 {t('minute')}</>],
	], [t]);

	return <Page>
		<Page.Header title={t('Real_Time_Monitoring')}>
		</Page.Header>
		<Page.ScrollableContentWithShadow>
			<Margins block='x4'>
				<Box flexDirection='row' display='flex' justifyContent='space-between' alignSelf='center' w='full'>
					<Field mie='x4' flexShrink={1}>
						<Field.Label>{t('Department')}</Field.Label>
						<Field.Row>
							<DepartmentAutoComplete placeholder={t('All')} value={department} onChange={setDepartment}/>
						</Field.Row>
					</Field>
					<Field mis='x4' flexShrink={1}>
						<Field.Label>{t('Update_every')}</Field.Label>
						<Field.Row>
							<Select options={reloadOptions} onChange={useMutableCallback((val) => setReloadFrequency(val))} value={reloadFrequency}/>
						</Field.Row>
					</Field>
				</Box>
				<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
					<ConversationOverview flexGrow={1} flexShrink={1} width='50%' reloadRef={reloadRef} params={allParams}/>
				</Box>
				<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
					<ChatsChart flexGrow={1} flexShrink={1} width='50%' mie='x2' reloadRef={reloadRef} params={allParams}/>
					<ChatsPerAgentChart flexGrow={1} flexShrink={1} width='50%' mis='x2' reloadRef={reloadRef} params={allParams}/>
				</Box>
				<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
					<ChatsOverview flexGrow={1} flexShrink={1} width='50%' reloadRef={reloadRef} params={allParams}/>
				</Box>
				<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
					<AgentStatusChart flexGrow={1} flexShrink={1} width='50%' mie='x2' reloadRef={reloadRef} params={allParams}/>
					<ChatsPerDepartmentChart flexGrow={1} flexShrink={1} width='50%' mis='x2' reloadRef={reloadRef} params={allParams}/>
				</Box>
				<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
					<AgentsOverview flexGrow={1} flexShrink={1} reloadRef={reloadRef} params={allParams}/>
				</Box>
				<Box display='flex' w='full' flexShrink={1}>
					<ChatDurationChart flexGrow={1} flexShrink={1} w='100%' reloadRef={reloadRef} params={allParams}/>
				</Box>
				<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
					<ProductivityOverview flexGrow={1} flexShrink={1} reloadRef={reloadRef} params={allParams}/>
				</Box>
				<Box display='flex' w='full' flexShrink={1}>
					<ResponseTimesChart flexGrow={1} flexShrink={1} w='100%' reloadRef={reloadRef} params={allParams}/>
				</Box>
			</Margins>
		</Page.ScrollableContentWithShadow>
	</Page>;
};

export default RealTimeMonitoringPage;
