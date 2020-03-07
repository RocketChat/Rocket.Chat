import { ResponsiveLine } from '@nivo/line';
import { Box, Flex, Skeleton, Tile } from '@rocket.chat/fuselage';
import moment from 'moment';
import React, { useMemo } from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { CounterSet } from '../data/CounterSet';
import { LegendSymbol } from '../data/LegendSymbol';
import { useEndpointData } from '../../hooks/useEndpointData';
import { Section } from '../Section';

export function ActiveUsersSection() {
	const t = useTranslation();

	const params = useMemo(() => ({
		start: moment().toISOString(),
	}), []);

	const overviewData = useEndpointData('GET', 'engagement-dashboard/users/active-users/overview', params);

	const [
		countDailyActiveUsers,
		diffDailyActiveUsers,
		countWeeklyActiveUsers,
		diffWeeklyActiveUsers,
		countMonthlyActiveUsers,
		diffMonthlyActiveUsers,
	] = useMemo(() => {
		if (!overviewData) {
			return [];
		}

		return [
			overviewData.daily.current,
			overviewData.daily.diffFromYesterday,
			overviewData.week.current,
			overviewData.week.diffFromLastWeek,
			overviewData.month.current,
			0,
		];
	}, [overviewData]);

	const streamData = useEndpointData('GET', 'engagement-dashboard/users/active-users/monthly-data', params);

	const [
		dauValues,
		wauValues,
		mauValues,
	] = useMemo(() => {
		if (!streamData) {
			return [];
		}

		return [
			streamData.month.map(({ year, month, day, users }) => ({
				x: moment.utc([year, month, day]).toDate(),
				y: users,
			})),
			[],
			[],
		];
	}, [streamData]);

	return <Section title={t('Active users')} filter={null}>
		<CounterSet
			counters={[
				{
					count: overviewData ? countDailyActiveUsers : <Skeleton variant='rect' width='3ex' height='1em' />,
					variation: overviewData ? diffDailyActiveUsers : 0,
					description: <><LegendSymbol color='#D1EBFE' /> {t('Daily Active Users')}</>,
				},
				{
					count: overviewData ? countWeeklyActiveUsers : <Skeleton variant='rect' width='3ex' height='1em' />,
					variation: overviewData ? diffWeeklyActiveUsers : 0,
					description: <><LegendSymbol color='#76B7FC' /> {t('Weekly Active Users')}</>,
				},
				{
					count: overviewData ? countMonthlyActiveUsers : <Skeleton variant='rect' width='3ex' height='1em' />,
					variation: overviewData ? diffMonthlyActiveUsers : 0,
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
											id: 'dau',
											data: dauValues,
										},
										{
											id: 'wau',
											data: wauValues,
										},
										{
											id: 'mau',
											data: mauValues,
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
										tooltip: {
											container: {
												backgroundColor: '#1F2329',
												boxShadow: '0px 0px 12px rgba(47, 52, 61, 0.12), 0px 0px 2px rgba(47, 52, 61, 0.08)',
												borderRadius: 2,
											},
										},
									}}
									enableSlices='x'
									sliceTooltip={({ slice: { points } }) => <Tile elevation='2'>
										{points.map(({ serieId, data: { y: activeUsers } }) =>
											<Box key={serieId} textStyle='p2'>
												{(serieId === 'dau' && t('DAU = %d', activeUsers))
										|| (serieId === 'wau' && t('WAU = %d', activeUsers))
										|| (serieId === 'mau' && t('MAU = %d', activeUsers))}
											</Box>)}
									</Tile>}
								/>
							</Box>
						</Box>
					</Flex.Item>
				</Box>
				: <Skeleton variant='rect' height={240} />}
		</Flex.Container>
	</Section>;
}
