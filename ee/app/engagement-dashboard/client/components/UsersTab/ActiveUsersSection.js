import { ResponsiveLine } from '@nivo/line';
import { Box, Flex, Skeleton } from '@rocket.chat/fuselage';
import moment from 'moment';
import React, { useMemo } from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { CounterSet } from '../data/CounterSet';
import { LegendSymbol } from '../data/LegendSymbol';
import { useEndpointData } from '../../hooks/useEndpointData';
import { Section } from '../Section';

export function ActiveUsersSection() {
	const t = useTranslation();

	const overviewParams = useMemo(() => ({
		start: moment().toISOString(),
	}), []);

	const streamParams = useMemo(() => ({
		start: moment().toISOString(),
	}), []);

	const overviewData = useEndpointData('GET', 'engagement-dashboard/users/active-users/overview', overviewParams);
	const streamData = useEndpointData('GET', 'engagement-dashboard/users/active-users/monthly-data', streamParams);

	return <Section title={t('Active users')} filter={null}>
		<CounterSet
			counters={[
				{
					count: overviewData ? overviewData.daily.current : <Skeleton variant='rect' width='3ex' height='1em' />,
					variation: overviewData ? overviewData.daily.diffFromYesterday : 0,
					description: <><LegendSymbol color='#D1EBFE' /> {t('Daily Active Users')}</>,
				},
				{
					count: overviewData ? overviewData.week.current : <Skeleton variant='rect' width='3ex' height='1em' />,
					variation: overviewData ? overviewData.week.differFromLastWeek : 0,
					description: <><LegendSymbol color='#76B7FC' /> {t('Weekly Active Users')}</>,
				},
				{
					count: overviewData ? overviewData.daily.current : <Skeleton variant='rect' width='3ex' height='1em' />,
					description: <><LegendSymbol color='#1D74F5' /> {t('Monthly Active Users')}</>,
				},
			]}
		/>
		<Flex.Container>
			{streamData
				? <Box style={{ height: 240 }}>
					<Flex.Item align='stretch' grow={1} shrink={0}>
						<Box style={{ position: 'relative' }}>
							<Box style={{ position: 'absolute', width: '100%', height: '100%' }}>
								<ResponsiveLine
									data={[
										{
											id: t('Daily Active Users'),
											data: [],
										},
										{
											id: t('Weekly Active Users'),
											data: [],
										},
										{
											id: t('Monthly Active Users'),
											data: [],
										},
									]}
									xScale={{
										type: 'time',
										format: 'native',
										precision: 'day',
									}}
									xFormat='time:%Y-%m-%d'
									yScale={{
										type: 'linear',
										stacked: true,
									}}
									enableGridX={false}
									enableGridY={false}
									enablePoints={false}
									useMesh
									enableArea
									areaOpacity={1}
									enableCrosshair
									crosshairType='bottom'
									margin={{
										// TODO: Get it from theme
										top: 0,
										bottom: 20,
										right: 0,
										left: 40,
									}}
									colors={[
										'#D1EBFE',
										'#76B7FC',
										'#1D74F5',
									]}
									axisLeft={{
										// TODO: Get it from theme
										tickSize: 0,
										tickPadding: 4,
										tickRotation: 0,
										tickValues: 3,
									}}
									axisBottom={{
										// TODO: Get it from theme
										tickSize: 0,
										tickPadding: 4,
										tickRotation: 0,
										format: '%Y-%m-%d',
										tickValues: 'every 7 days',
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
