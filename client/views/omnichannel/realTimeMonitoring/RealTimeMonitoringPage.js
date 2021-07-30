import { Box, Select, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useRef, useState, useMemo, useEffect } from 'react';

import AutoCompleteDepartment from '../../../components/AutoCompleteDepartment';
import Page from '../../../components/Page';
import { useTranslation } from '../../../contexts/TranslationContext';
import { getDateRange } from '../../../lib/getDateRange';
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

const dateRange = getDateRange();

const RealTimeMonitoringPage = () => {
	const t = useTranslation();

	const [reloadFrequency, setReloadFrequency] = useState(5);
	const [department, setDepartment] = useState('');

	const reloadRef = useRef({});

	const departmentParams = useMemo(
		() => ({
			...(department?.value && { departmentId: department?.value }),
		}),
		[department],
	);

	const allParams = useMemo(
		() => ({
			...departmentParams,
			...dateRange,
		}),
		[departmentParams],
	);

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

	const reloadOptions = useMemo(
		() => [
			[5, <>5 {t('seconds')}</>],
			[10, <>10 {t('seconds')}</>],
			[30, <>30 {t('seconds')}</>],
			[60, <>1 {t('minute')}</>],
		],
		[t],
	);

	return (
		<Page>
			<Page.Header title={t('Real_Time_Monitoring')}></Page.Header>
			<Page.ScrollableContentWithShadow>
				<Margins block='x4'>
					<Box
						flexDirection='row'
						display='flex'
						justifyContent='space-between'
						alignSelf='center'
						w='full'
					>
						<Box maxWidth='50%' display='flex' mi='x4' flexGrow={1} flexDirection='column'>
							<Label mb='x4'>{t('Departments')}</Label>
							<AutoCompleteDepartment
								value={department}
								onChange={setDepartment}
								placeholder={t('All')}
								label={t('All')}
								onlyMyDepartments
							/>
						</Box>
						<Box maxWidth='50%' display='flex' mi='x4' flexGrow={1} flexDirection='column'>
							<Label mb='x4'>{t('Update_every')}</Label>
							<Select
								options={reloadOptions}
								onChange={useMutableCallback((val) => setReloadFrequency(val))}
								value={reloadFrequency}
							/>
						</Box>
					</Box>
					<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
						<ConversationOverview
							flexGrow={1}
							flexShrink={1}
							width='50%'
							reloadRef={reloadRef}
							params={allParams}
						/>
					</Box>
					<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
						<ChatsChart
							flexGrow={1}
							flexShrink={1}
							width='50%'
							mie='x2'
							reloadRef={reloadRef}
							params={allParams}
						/>
						<ChatsPerAgentChart
							flexGrow={1}
							flexShrink={1}
							width='50%'
							mis='x2'
							reloadRef={reloadRef}
							params={allParams}
						/>
					</Box>
					<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
						<ChatsOverview
							flexGrow={1}
							flexShrink={1}
							width='50%'
							reloadRef={reloadRef}
							params={allParams}
						/>
					</Box>
					<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
						<AgentStatusChart
							flexGrow={1}
							flexShrink={1}
							width='50%'
							mie='x2'
							reloadRef={reloadRef}
							params={allParams}
						/>
						<ChatsPerDepartmentChart
							flexGrow={1}
							flexShrink={1}
							width='50%'
							mis='x2'
							reloadRef={reloadRef}
							params={allParams}
						/>
					</Box>
					<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
						<AgentsOverview flexGrow={1} flexShrink={1} reloadRef={reloadRef} params={allParams} />
					</Box>
					<Box display='flex' w='full' flexShrink={1}>
						<ChatDurationChart
							flexGrow={1}
							flexShrink={1}
							w='100%'
							reloadRef={reloadRef}
							params={allParams}
						/>
					</Box>
					<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
						<ProductivityOverview
							flexGrow={1}
							flexShrink={1}
							reloadRef={reloadRef}
							params={allParams}
						/>
					</Box>
					<Box display='flex' w='full' flexShrink={1}>
						<ResponseTimesChart
							flexGrow={1}
							flexShrink={1}
							w='100%'
							reloadRef={reloadRef}
							params={allParams}
						/>
					</Box>
				</Margins>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default RealTimeMonitoringPage;
