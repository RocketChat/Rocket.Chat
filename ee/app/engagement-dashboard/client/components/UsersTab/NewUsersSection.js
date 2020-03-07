import { ResponsiveBar } from '@nivo/bar';
import { Box, Flex, Select, Skeleton } from '@rocket.chat/fuselage';
import moment from 'moment';
import React, { useMemo, useState } from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { useEndpointData } from '../../hooks/useEndpointData';
import { CounterSet } from '../data/CounterSet';
import { Section } from '../Section';

export function NewUsersSection() {
	const t = useTranslation();

	const periodOptions = useMemo(() => [
		['last 7 days', t('Last 7 days')],
		['last 30 days', t('Last 30 days')],
		['last 90 days', t('Last 90 days')],
	], [t]);
	const [period, setPeriod] = useState('last 7 days');

	const handlePeriodChange = (period) => setPeriod(period);

	const params = useMemo(() => {
		switch (period) {
			case 'last 7 days':
				return {
					start: moment().subtract(6, 'days').toISOString(),
					end: moment().toISOString(),
				};

			case 'last 30 days':
				return {
					start: moment().subtract(29, 'days').toISOString(),
					end: moment().toISOString(),
				};

			case 'last 90 days':
				return {
					start: moment().subtract(89, 'days').toISOString(),
					end: moment().toISOString(),
				};
		}
	}, [period]);

	const data = useEndpointData('GET', 'engagement-dashboard/users/weekly-data', params);

	const [
		countFromLast7Days,
		diffFromLast7Days,
		countFromYesterday,
		diffFromYesterday,
		values,
	] = useMemo(() => {
		if (!data) {
			return [];
		}

		return [
			data.week.users,
			data.week.diffFromLastWeek,
			data.yesterday.users,
			data.yesterday.diffFromToday,
			data.days.map(({ day, users }) => ({ date: day, newUsers: users + 100 * Math.random() }))
				.sort(({ date: a }, { date: b }) => moment(a).diff(b).valueOf()),
		];
	}, [data]);

	return <Section
		title={t('New users')}
		filter={<Select options={periodOptions} value={period} onChange={handlePeriodChange} />}
	>
		<CounterSet
			counters={[
				{
					count: data ? countFromLast7Days : <Skeleton variant='rect' width='3ex' height='1em' />,
					variation: data ? diffFromLast7Days : 0,
					description: t('Last 7 days'),
				},
				{
					count: data ? countFromYesterday : <Skeleton variant='rect' width='3ex' height='1em' />,
					variation: data ? diffFromYesterday : 0,
					description: t('Yesterday'),
				},
			]}
		/>
		<Flex.Container>
			{data
				? <Box style={{ height: 240 }}>
					<Flex.Item align='stretch' grow={1} shrink={0}>
						<Box style={{ position: 'relative' }}>
							<Box style={{ position: 'absolute', width: '100%', height: '100%' }}>
								<ResponsiveBar
									data={values}
									indexBy='date'
									keys={['newUsers']}
									groupMode='grouped'
									padding={0.25}
									margin={{
										// TODO: Get it from theme
										bottom: 20,
									}}
									colors={[
										// TODO: Get it from theme
										'#1d74f5',
									]}
									enableLabel={false}
									enableGridY={false}
									axisTop={null}
									axisRight={null}
									axisBottom={(values.length === 7 && {
										tickSize: 0,
										// TODO: Get it from theme
										tickPadding: 4,
										tickRotation: 0,
										format: (date) => moment(date).format('dddd'),
									}) || null }
									axisLeft={null}
									animate={true}
									motionStiffness={90}
									motionDamping={15}
									theme={{
										// TODO: Get it from theme
										axis: {
											ticks: {
												text: {
													fill: '#9EA2A8',
													fontFamily: 'Inter, -apple-system, system-ui, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Meiryo UI", Arial, sans-serif',
													fontSize: '10px',
													fontStyle: 'normal',
													fontWeight: '600',
													letterSpacing: '0.2px',
													lineHeight: '12px',
												},
											},
										},
										tooltip: {
											container: {
												backgroundColor: '#1F2329',
												boxShadow: '0px 0px 12px rgba(47, 52, 61, 0.12), 0px 0px 2px rgba(47, 52, 61, 0.08)',
												borderRadius: 2,
											},
										},
									}}
									tooltip={({ value }) => <Box textStyle='p2' textColor='alternative'>
										{t('%d users', value)}
									</Box>}
								/>
							</Box>
						</Box>
					</Flex.Item>
				</Box>
				: <Skeleton variant='rect' height={240} />}
		</Flex.Container>
	</Section>;
}
