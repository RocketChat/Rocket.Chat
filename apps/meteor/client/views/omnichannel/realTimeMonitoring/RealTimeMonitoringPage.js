import { Box, Select, Margins, Option } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useRef, useState, useMemo, useEffect, Fragment } from 'react';

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

const randomizeKeys = (keys) => {
	keys.current = keys.current.map((_key, i) => {
		return `${i}_${new Date().getTime()}`;
	});
};

const dateRange = getDateRange();

const RealTimeMonitoringPage = () => {
	const t = useTranslation();

	const keys = useRef([...Array(10).keys()]);

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

	useEffect(() => {
		randomizeKeys(keys);
	}, [allParams]);

	const reloadCharts = useMutableCallback(() => {
		Object.values(reloadRef.current).forEach((reload) => {
			reload();
		});
	});

	useEffect(() => {
		const interval = setInterval(reloadCharts, reloadFrequency * 1000);
		return () => {
			clearInterval(interval);
			randomizeKeys(keys);
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
							<Select options={reloadOptions} onChange={useMutableCallback((val) => setReloadFrequency(val))} value={reloadFrequency} />
						</Box>
					</Box>
					<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
						<ConversationOverview key={keys?.current[0]} flexGrow={1} flexShrink={1} width='50%' reloadRef={reloadRef} params={allParams} />
					</Box>
					<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
						<ChatsChart key={keys?.current[1]} flexGrow={1} flexShrink={1} width='50%' mie={2} reloadRef={reloadRef} params={allParams} />
						<ChatsPerAgentChart
							key={keys?.current[2]}
							flexGrow={1}
							flexShrink={1}
							width='50%'
							mis={2}
							reloadRef={reloadRef}
							params={allParams}
						/>
					</Box>
					<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
						<ChatsOverview key={keys?.current[3]} flexGrow={1} flexShrink={1} width='50%' reloadRef={reloadRef} params={allParams} />
					</Box>
					<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
						<AgentStatusChart
							key={keys?.current[4]}
							flexGrow={1}
							flexShrink={1}
							width='50%'
							mie={2}
							reloadRef={reloadRef}
							params={allParams}
						/>
						<ChatsPerDepartmentChart
							key={keys?.current[5]}
							flexGrow={1}
							flexShrink={1}
							width='50%'
							mis={2}
							reloadRef={reloadRef}
							params={allParams}
						/>
					</Box>
					<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
						<AgentsOverview key={keys?.current[6]} flexGrow={1} flexShrink={1} reloadRef={reloadRef} params={allParams} />
					</Box>
					<Box display='flex' w='full' flexShrink={1}>
						<ChatDurationChart key={keys?.current[7]} flexGrow={1} flexShrink={1} w='100%' reloadRef={reloadRef} params={allParams} />
					</Box>
					<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1}>
						<ProductivityOverview key={keys?.current[8]} flexGrow={1} flexShrink={1} reloadRef={reloadRef} params={allParams} />
					</Box>
					<Box display='flex' w='full' flexShrink={1}>
						<ResponseTimesChart key={keys?.current[9]} flexGrow={1} flexShrink={1} w='100%' reloadRef={reloadRef} params={allParams} />
					</Box>
				</Margins>
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default RealTimeMonitoringPage;
