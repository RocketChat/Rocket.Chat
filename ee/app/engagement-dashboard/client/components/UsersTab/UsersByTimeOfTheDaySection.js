import { ResponsiveHeatMap } from '@nivo/heatmap';
import { Box, Flex, Select, Skeleton } from '@rocket.chat/fuselage';
import moment from 'moment';
import React, { useMemo, useState } from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { Section } from '../Section';
import { useEndpointData } from '../../hooks/useEndpointData';

export function UsersByTimeOfTheDaySection() {
	const t = useTranslation();

	const params = useMemo(() => ({ start: moment().subtract(20, 'days').toISOString() }), []);
	const data = useEndpointData('GET', 'engagement-dashboard/users/users-by-time-of-the-day-in-a-week', params);

	const [dates, groups] = useMemo(() => {
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

		const emptyGroup = dates.reduce((obj, date) => ({ ...obj, [String(date)]: 0 }), {});

		const groups = Array.from({ length: 24 });

		for (const { users, hour, date } of points) {
			const group = groups[hour] || { hour, ...emptyGroup };
			group[date] = users;
			groups[hour] = group;
		}

		return [
			dates.map(String),
			groups,
		];
	}, [data]);

	const [filterValue, setFilterValue] = useState(7);
	const filterOptions = useMemo(() => [
		[7, t('Last 7 days')],
	], [t]);

	const handleFilterChange = (filterValue) => {
		setFilterValue(filterValue);
	};

	return <Section
		title={t('Users by time of day')}
		filter={<Select options={filterOptions} value={filterValue} onChange={handleFilterChange} />}
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
										format: (hour) => moment().set({ hour, minute: 0, second: 0 }).format('LT'),
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
									}}
								/>
							</Box>
						</Box>
					</Flex.Item>
				</Box>
				: <Skeleton variant='rect' height={696} />}
		</Flex.Container>
	</Section>;
}
