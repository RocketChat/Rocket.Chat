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

	const [filterValue, setFilterValue] = useState(7);
	const filterOptions = useMemo(() => [
		[7, t('Last 7 days')],
		[15, t('Last 15 days')],
	], [t]);

	const handleFilterChange = (filterValue) => {
		setFilterValue(filterValue);
	};

	const params = useMemo(() => ({
		start: moment().subtract(filterValue, 'days').toISOString(),
		end: moment().toISOString(),
	}), [filterValue]);

	const data = useEndpointData('GET', 'engagement-dashboard/users/weekly-data', params);

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
					<Flex.Item align='stretch' grow={1} shrink={0}>
						<Box style={{ position: 'relative' }}>
							<Box style={{ position: 'absolute', width: '100%', height: '100%' }}>
								<ResponsiveBar
									data={data.days}
									indexBy='day'
									keys={['users']}
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
									axisBottom={{
										tickSize: 0,
										// TODO: Get it from theme
										tickPadding: 4,
										tickRotation: 0,
										format: (date) => moment(date).format(data.days.length === 7 ? 'dddd' : 'L'),
									}}
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
									}}
								/>
							</Box>
						</Box>
					</Flex.Item>
				</Box>
				: <Skeleton variant='rect' height={240} />}
		</Flex.Container>
	</Section>;
}
