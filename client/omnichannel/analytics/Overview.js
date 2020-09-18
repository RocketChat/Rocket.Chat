import React, { useEffect, useState, useMemo } from 'react';
import { Box, Skeleton } from '@rocket.chat/fuselage';

import CounterItem from '../realTimeMonitoring/counter/CounterItem';
import CounterRow from '../realTimeMonitoring/counter/CounterRow';
import { useMethodData, AsyncState } from '../../contexts/ServerContext';
import { useTranslation } from '../../contexts/TranslationContext';

const initialData = Array.from({ length: 3 }).map(() => ({ title: '', value: '' }));

const conversationsInitialData = [initialData, initialData];
const productivityInitialData = [initialData];

const Overview = ({ type, dateRange, departmentId }) => {
	const t = useTranslation();

	const { start, end } = dateRange;

	const params = useMemo(() => [{
		analyticsOptions: { name: type },
		daterange: { from: start, to: end },
		...departmentId && { departmentId },
	}], [departmentId, end, start, type]);

	const [data, state] = useMethodData('livechat:getAnalyticsOverviewData', params);

	const [displayData, setDisplayData] = useState(conversationsInitialData);

	useEffect(() => {
		setDisplayData(type === 'Conversations' ? conversationsInitialData : productivityInitialData);
	}, [type]);

	useEffect(() => {
		if (state === AsyncState.DONE) {
			if (data?.length > 3) {
				setDisplayData([data.slice(0, 3), data.slice(3)]);
			} else if (data) {
				setDisplayData([data]);
			}
		}
	}, [data, state]);

	return <Box
		pb='x28'
		flexDirection='column'
	>
		{
			displayData.map((items = [], i) => <CounterRow key={i} border='0' pb='none'>
				{items.map(({ title, value }, i) => <CounterItem flexShrink={1} pb='x8' flexBasis='100%' key={i} title={title ? t(title) : <Skeleton width='x60' />} count={value}/>)}
			</CounterRow>)
		}
	</Box>;
};

export default Overview;
