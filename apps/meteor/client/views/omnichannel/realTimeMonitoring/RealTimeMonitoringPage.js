import { Box, Select, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useRef, useState, useMemo, useEffect, Fragment } from 'react';

import AutoCompleteDepartment from '../../../components/AutoCompleteDepartment';
import Page from '../../../components/Page';
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

const dateRange = getDateRange();

const RealTimeMonitoringPage = () => {
	const t = useTranslation();

	const [reloadFrequency, setReloadFrequency] = useState(5);
	const [departmentId, setDepartment] = useState('');

	const reloadRef = useRef({});

	const departmentParams = useMemo(
		() => ({
			...(departmentId && { departmentId }),
		}),
		[departmentId],
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
			[5, <Fragment key='5 seconds'>5 {t('seconds')}</Fragment>],
			[10, <Fragment key='10 seconds'>10 {t('seconds')}</Fragment>],
			[30, <Fragment key='30 seconds'>30 {t('seconds')}</Fragment>],
			[60, <Fragment key='1 minute'>1 {t('minute')}</Fragment>],
		],
		[t],
	);

	return (
		<Page>
			<Page.Header title={t('Real_Time_Monitoring')}></Page.Header>
			<Page.ScrollableContentWithShadow>
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
							/>
						</Box>
						<Box maxWidth='50%' display='flex' mi={4} flexGrow={1} flexDirection='column'>
							<Label mb={4}>{t('Update_every')}</Label>
							<Select options={reloadOptions} onChange={useMutableCallback((val) => setReloadFrequency(val))} value={reloadFrequency} />
						</Box>
					</Box>
					<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
						<ConversationOverview flexGrow={1} flexShrink={1} width='50%' reloadRef={reloadRef} params={allParams} />
					</Box>
					<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
						<ChatsChart flexGrow={1} flexShrink={1} width='50%' mie={2} reloadRef={reloadRef} params={allParams} />
						<ChatsPerAgentChart flexGrow={1} flexShrink={1} width='50%' mis={2} reloadRef={reloadRef} params={allParams} />
					</Box>
					<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
						<ChatsOverview flexGrow={1} flexShrink={1} width='50%' reloadRef={reloadRef} params={allParams} />
					</Box>
					<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
						<AgentStatusChart flexGrow={1} flexShrink={1} width='50%' mie={2} reloadRef={reloadRef} params={allParams} />
						<ChatsPerDepartmentChart flexGrow={1} flexShrink={1} width='50%' mis={2} reloadRef={reloadRef} params={allParams} />
					</Box>
					<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
						<AgentsOverview flexGrow={1} flexShrink={1} reloadRef={reloadRef} params={allParams} />
					</Box>
					<Box display='flex' w='full' flexShrink={1}>
						<ChatDurationChart flexGrow={1} flexShrink={1} w='100%' reloadRef={reloadRef} params={allParams} />
					</Box>
					<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
						<ProductivityOverview flexGrow={1} flexShrink={1} reloadRef={reloadRef} params={allParams} />
					</Box>
					<Box display='flex' w='full' flexShrink={1}>
						<ResponseTimesChart flexGrow={1} flexShrink={1} w='100%' reloadRef={reloadRef} params={allParams} />
					</Box>
				</Margins>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default RealTimeMonitoringPage;
