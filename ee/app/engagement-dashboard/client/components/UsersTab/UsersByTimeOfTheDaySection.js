import { ResponsiveHeatMap } from '@nivo/heatmap';
import { Box, Flex, Select, Skeleton } from '@rocket.chat/fuselage';
import moment from 'moment';
import React, { useMemo, useState } from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { Section } from '../Section';
import { useEndpointData } from '../../hooks/useEndpointData';

export function UsersByTimeOfTheDaySection() {
	const t = useTranslation();

	const periodOptions = useMemo(() => [
		['last 7 days', t('Last 7 days')],
		['last 30 days', t('Last 30 days')],
		['last 90 days', t('Last 90 days')],
	], [t]);
	const [period, setPeriod] = useState('last 7 days');

	const handleFilterChange = (period) => setPeriod(period);

	const params = useMemo(() => {
		switch (period) {
			case 'last 7 days':
				return {
					start: moment().subtract(6, 'days').toISOString(),
					// end: moment().toISOString(),
				};

			case 'last 30 days':
				return {
					start: moment().subtract(29, 'days').toISOString(),
					// end: moment().toISOString(),
				};

			case 'last 90 days':
				return {
					start: moment().subtract(89, 'days').toISOString(),
					// end: moment().toISOString(),
				};
		}
	}, [period]);

	const data = useEndpointData('GET', 'engagement-dashboard/users/users-by-time-of-the-day-in-a-week', params);

	const [
		dates,
		groups,
	] = useMemo(() => {
		if (!data) {
			return [];
		}

		const points = data.week
			.map(({ users, hour, day, month, year }) => ({
				users,
				hour,
				date: moment.utc([year, month - 1, day, 0, 0, 0]).valueOf(),
			}));

		const dates = Array.from(points.reduce((set, { date }) => { set.add(date); return set; }, new Set())).sort();

		const groups = Array.from({ length: 24 }, (_, hour) => ({
			hour: String(hour),
			...dates.reduce((obj, date) => ({ ...obj, [String(date)]: 0 }), {}),
		}));

		for (const { users, hour, date } of points) {
			groups[hour][date] = users;
		}

		return [
			dates.map(String),
			groups,
		];
	}, [data]);

	return <Section
		title={t('Users by time of day')}
		filter={<Select options={periodOptions} value={period} onChange={handleFilterChange} />}
	>
		<Flex.Container>
			{data
				? <Box style={{ height: 696 }}>
					<Flex.Item align='stretch' grow={1} shrink={0}>
						<Box style={{ position: 'relative' }}>
							<Box style={{ position: 'absolute', width: '100%', height: '100%' }}>
								<ResponsiveHeatMap
									data={groups}
									indexBy='hour'
									keys={dates}
									groupMode='grouped'
									padding={4}
									margin={{
										// TODO: Get it from theme
										left: 40,
										bottom: 20,
									}}
									colors={[
										// TODO: Get it from theme
										'#E8F2FF',
										'#D1EBFE',
										'#A4D3FE',
										'#76B7FC',
										'#549DF9',
										'#1D74F5',
										'#10529E',
									]}
									cellOpacity={1}
									enableLabels={false}
									axisTop={null}
									axisRight={null}
									axisBottom={{
										// TODO: Get it from theme
										tickSize: 0,
										tickPadding: 4,
										tickRotation: 0,
										format: (timestamp) => moment(parseInt(timestamp, 10)).format(dates.length === 7 ? 'dddd' : 'L'),
									}}
									axisLeft={{
										// TODO: Get it from theme
										tickSize: 0,
										tickPadding: 4,
										tickRotation: 0,
										format: (hour) => moment().set({ hour: parseInt(hour, 10), minute: 0, second: 0 }).format('LT'),
									}}
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
													fontSize: 10,
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
				: <Skeleton variant='rect' height={696} />}
		</Flex.Container>
	</Section>;
}
