import { Box, Skeleton } from '@rocket.chat/fuselage';
import { useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useEffect, useState, useMemo } from 'react';

import CounterItem from '../realTimeMonitoring/counter/CounterItem';
import CounterRow from '../realTimeMonitoring/counter/CounterRow';

const initialData = Array.from({ length: 3 }).map(() => ({ title: '', value: '' }));

const conversationsInitialData = [initialData, initialData];
const productivityInitialData = [initialData];

const Overview = ({ type, dateRange, departmentId }) => {
	const t = useTranslation();

	const { start, end } = dateRange;

	const params = useMemo(
		() => ({
			analyticsOptions: { name: type },
			daterange: { from: start, to: end },
			...(departmentId && { departmentId }),
		}),
		[departmentId, end, start, type],
	);

	const loadData = useMethod('livechat:getAnalyticsOverviewData');

	const [displayData, setDisplayData] = useState(conversationsInitialData);

	useEffect(() => {
		setDisplayData(type === 'Conversations' ? conversationsInitialData : productivityInitialData);
	}, [type]);

	useEffect(() => {
		async function fetchData() {
			if (!start || !end) {
				return;
			}

			const value = await loadData(params);
			if (!value) {
				return;
			}

			if (value.length > 3) {
				return setDisplayData([value.slice(0, 3), value.slice(3)]);
			}

			setDisplayData([value]);
		}
		fetchData();
	}, [start, end, loadData, params]);

	return (
		<Box pb='x28' flexDirection='column'>
			{displayData.map((items = [], i) => (
				<CounterRow key={i} border='0' pb='none'>
					{items.map(({ title, value }, i) => (
						<CounterItem
							flexShrink={1}
							pb='x8'
							flexBasis='100%'
							key={i}
							title={title ? t(title) : <Skeleton width='x60' />}
							count={value}
						/>
					))}
				</CounterRow>
			))}
		</Box>
	);
};

export default Overview;
