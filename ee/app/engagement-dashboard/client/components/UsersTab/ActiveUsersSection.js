import { ResponsiveLine } from '@nivo/line';
import { Box, Flex, Skeleton, Tile } from '@rocket.chat/fuselage';
import moment from 'moment';
import React, { useMemo } from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { useEndpointData } from '../../../../../../client/hooks/useEndpointData';
import { CounterSet } from '../data/CounterSet';
import { LegendSymbol } from '../data/LegendSymbol';
import { Section } from '../Section';

export function ActiveUsersSection() {
	const t = useTranslation();

	const period = useMemo(() => ({
		start: moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(30, 'days'),
		end: moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(1),
	}), []);

	const params = useMemo(() => ({
		start: period.start.clone().subtract(30, 'days').toISOString(),
		end: period.end.toISOString(),
	}), [period]);

	const data = useEndpointData('engagement-dashboard/users/active-users', params);

	const [
		countDailyActiveUsers,
		diffDailyActiveUsers,
		countWeeklyActiveUsers,
		diffWeeklyActiveUsers,
		countMonthlyActiveUsers,
		diffMonthlyActiveUsers,
		dauValues,
		wauValues,
		mauValues,
	] = useMemo(() => {
		if (!data) {
			return [];
		}

		const createPoint = (i) => ({
			x: moment(period.start).add(i, 'days').toDate(),
			y: 0,
		});

		const createPoints = () => Array.from({ length: moment(period.end).diff(period.start, 'days') + 1 }, (_, i) => createPoint(i));

		const distributeValueOverPoints = (value, i, T, array, prev) => {
			for (let j = 0; j < T; ++j) {
				const k = i + j;

				if (k >= array.length) {
					continue;
				}

				if (k >= 0) {
					array[k].y += value;
				}

				if (k === -1) {
					prev.y += value;
				}
			}
		};

		const dauValues = createPoints();
		const prevDauValue = createPoint(-1);
		const wauValues = createPoints();
		const prevWauValue = createPoint(-1);
		const mauValues = createPoints();
		const prevMauValue = createPoint(-1);

		for (const { users, day, month, year } of data.month) {
			const i = moment.utc([year, month - 1, day, 0, 0, 0, 0]).diff(period.start, 'days');
			distributeValueOverPoints(users, i, 1, dauValues, prevDauValue);
			distributeValueOverPoints(users, i, 7, wauValues, prevWauValue);
			distributeValueOverPoints(users, i, 30, mauValues, prevMauValue);
		}

		return [
			dauValues[dauValues.length - 1].y,
			dauValues[dauValues.length - 1].y - prevDauValue.y,
			wauValues[wauValues.length - 1].y,
			wauValues[wauValues.length - 1].y - prevWauValue.y,
			mauValues[mauValues.length - 1].y,
			mauValues[mauValues.length - 1].y - prevMauValue.y,
			dauValues,
			wauValues,
			mauValues,
		];
	}, [period, data]);

	return <Section title={t('Active_users')} filter={null}>
		<CounterSet
			counters={[
				{
					count: data ? countDailyActiveUsers : <Skeleton variant='rect' width='3ex' height='1em' />,
					variation: data ? diffDailyActiveUsers : 0,
					description: <><LegendSymbol color='#D1EBFE' /> {t('Daily_Active_Users')}</>,
				},
				{
					count: data ? countWeeklyActiveUsers : <Skeleton variant='rect' width='3ex' height='1em' />,
					variation: data ? diffWeeklyActiveUsers : 0,
					description: <><LegendSymbol color='#76B7FC' /> {t('Weekly_Active_Users')}</>,
				},
				{
					count: data ? countMonthlyActiveUsers : <Skeleton variant='rect' width='3ex' height='1em' />,
					variation: data ? diffMonthlyActiveUsers : 0,
					description: <><LegendSymbol color='#1D74F5' /> {t('Monthly_Active_Users')}</>,
				},
			]}
		/>
		<Flex.Container>
			{data
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
										tickValues: 'every 3 days',
										format: (date) => moment(date).format(dauValues.length === 7 ? 'dddd' : 'L'),
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
											<Box key={serieId} fontScale='p2'>
												{(serieId === 'dau' && t('DAU_value', { value: activeUsers }))
										|| (serieId === 'wau' && t('WAU_value', { value: activeUsers }))
										|| (serieId === 'mau' && t('MAU_value', { value: activeUsers }))}
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
