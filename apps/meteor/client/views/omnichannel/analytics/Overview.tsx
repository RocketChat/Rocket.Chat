import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import CounterItem from '../realTimeMonitoring/counter/CounterItem';
import CounterRow from '../realTimeMonitoring/counter/CounterRow';

const initialData: { title?: string; value: string | number }[] = Array.from({ length: 3 }).map(() => ({ title: undefined, value: '' }));

const conversationsInitialData = [initialData, initialData];
const productivityInitialData = [initialData];

const Overview = ({ type, dateRange, departmentId }: { type: string; dateRange: { start: string; end: string }; departmentId: string }) => {
	const { t } = useTranslation();

	const { start, end } = dateRange;

	const params = useMemo(
		() => ({
			name: type,
			from: start,
			to: end,
			...(departmentId && { departmentId }),
		}),
		[departmentId, end, start, type],
	);

	const loadData = useEndpoint('GET', '/v1/livechat/analytics/overview');

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
		<Box pb={28} flexDirection='column'>
			{displayData.map((items = [], i) => (
				<CounterRow key={i} border='0' pb='none'>
					{items.map(({ title, value }, i) => (
						<CounterItem
							flexShrink={1}
							pb={8}
							flexBasis='100%'
							key={i}
							title={title ? t(title as TranslationKey) : <Skeleton width='x60' />}
							count={value}
						/>
					))}
				</CounterRow>
			))}
		</Box>
	);
};

export default Overview;
