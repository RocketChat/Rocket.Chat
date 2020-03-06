import { ResponsiveHeatMap } from '@nivo/heatmap';
import { Box, Flex, Skeleton } from '@rocket.chat/fuselage';
import moment from 'moment';
import React, { useMemo } from 'react';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { Section } from '../Section';
import { useEndpointData } from '../../hooks/useEndpointData';
import { monochromaticColors } from '../data/colors';

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

	console.log(data);
	console.log(dates);
	console.log(groups);

	return <Section title={t('Users by time of day')} filter={null}>
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
									margin={{ left: 32, bottom: 20 }}
									colors={monochromaticColors}
									cellOpacity={1}
									enableLabels={false}
									axisTop={null}
									axisRight={null}
									axisBottom={{
										tickSize: 0,
										tickPadding: 5,
										tickRotation: 0,
										format: (timestamp) => moment(parseInt(timestamp, 10)).format(dates.length === 7 ? 'dddd' : 'L'),
									}}
									axisLeft={{
										tickSize: 0,
										tickPadding: 5,
										tickRotation: 0,
										format: (hour) => moment().set({ hour, minute: 0, second: 0 }).format('LT'),
									}}
									animate={true}
									motionStiffness={90}
									motionDamping={15}
									theme={{
										font: 'inherit',
										fontStyle: 'normal',
										fontWeight: 600,
										fontSize: 10,
										lineHeight: 12,
										letterSpacing: 0.2,
										color: '#9EA2A8',
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
