import { Box, Flex, Select, Skeleton } from '@rocket.chat/fuselage';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';

import { useEndpoint } from '../../../../../client/contexts/ServerContext';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';
import { CounterSet } from '../data/CounterSet';
import { CountGraph } from '../data/CountGraph';
import { Section } from '../Section';

export function NewUsersSection() {
	const t = useTranslation();

	const [filterValue, setFilterValue] = useState(7);
	const filterOptions = useMemo(() => [
		[7, t('Last 7 days')],
		[15, t('Last 15 days')],
	], [t]);

	const [data, setData] = useState(null);

	const handleFilterChange = (filterValue) => {
		setFilterValue(filterValue);
	};

	const getData = useEndpoint('GET', 'engagement-dashboard/users/weekly-data');
	const dispatchToastMessage = useToastMessageDispatch();

	useEffect(() => {
		let mounted = true;

		const fetchData = async () => {
			const start = moment().subtract(filterValue - 1, 'days').toISOString();
			const end = moment().toISOString();
			try {
				const timer = setTimeout(() => {
					if (!mounted) {
						return;
					}

					setData(null);
				}, 3000);

				const data = await getData({ start, end });

				clearTimeout(timer);

				if (!data.success) {
					throw new Error();
				}

				if (!mounted) {
					return;
				}

				setData(data);
			} catch (error) {
				console.error(error);
				dispatchToastMessage({ type: 'error', message: error });
			}
		};

		fetchData();

		return () => {
			mounted = false;
		};
	}, [getData, filterValue]);

	// const { week, yesterday, days } = data;
	console.log(data);

	return <Section
		title={t('New users')}
		filter={<Select options={filterOptions} value={filterValue} onChange={handleFilterChange} />}
	>
		<CounterSet
			counters={[
				{
					count: data ? data.week.users : <Skeleton variant='rect' width='3ex' height='1em' />,
					variation: data ? data.week.diffFromToday : 0,
					description: t('Last 7 days'),
				},
				{
					count: data ? data.yesterday.users : <Skeleton variant='rect' width='3ex' height='1em' />,
					variation: data ? data.yesterday.diffFromToday : 0,
					description: t('Yesterday'),
				},
			]}
		/>
		<Flex.Container>
			{data
				? <Box style={{ height: 240 }}>
					<CountGraph
						data={[
							[t('Monday'), Math.round(168 * Math.random())],
							[t('Tuesday'), Math.round(88 * Math.random())],
							[t('Wednesday'), Math.round(131 * Math.random())],
							[t('Thurday'), Math.round(145 * Math.random())],
							[t('Friday'), Math.round(26 * Math.random())],
							[t('Saturday'), Math.round(60 * Math.random())],
							[t('Sunday'), Math.round(50 * Math.random())],
						]}
					/>
				</Box>
				: <Skeleton variant='rect' height={240} />}
		</Flex.Container>
	</Section>;
}
