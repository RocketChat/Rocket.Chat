import { ResponsiveLine } from '@nivo/line';
import { Box, Flex, Skeleton, Tile, ActionButton } from '@rocket.chat/fuselage';
import moment from 'moment';
import React, { useMemo } from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { useEndpointData } from '../../../../../../client/hooks/useEndpointData';
import { useFormatDate } from '../../../../../../client/hooks/useFormatDate';
import CounterSet from '../../../../../../client/components/data/CounterSet';
import { LegendSymbol } from '../data/LegendSymbol';
import { Section } from '../Section';
import { downloadCsvAs } from '../../../../../../client/lib/download';

const ActiveUsersSection = ({ timezone }) => {
	const t = useTranslation();
	const utc = timezone === 'utc';
	const formatDate = useFormatDate();
	const period = useMemo(() => ({
		start: utc
			? moment.utc().subtract(30, 'days')
			: moment().subtract(30, 'days'),
		end: utc
			? moment.utc().subtract(1, 'days')
			: moment().subtract(1, 'days'),
	}), [utc]);

	const params = useMemo(() => ({
		start: period.start.clone().subtract(29, 'days').toISOString(),
		end: period.end.toISOString(),
	}), [period]);

	const { value: data } = useEndpointData('engagement-dashboard/users/active-users', useMemo(() => params, [params]));

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

		const dauValues = createPoints();
		const prevDauValue = createPoint(-1);
		const wauValues = createPoints();
		const prevWauValue = createPoint(-1);
		const mauValues = createPoints();
		const prevMauValue = createPoint(-1);

		const usersListsMap = data.month.reduce((map, dayData) => {
			const date = moment({ year: dayData.year, month: dayData.month - 1, day: dayData.day });
			const dateOffset = date.diff(period.start, 'days');
			if (dateOffset >= 0) {
				map[dateOffset] = dayData.usersList;
				dauValues[dateOffset].y = dayData.users;
			}
			return map;
		}, {});

		const distributeValueOverPoints = (usersListsMap, dateOffset, T, array) => {
			const usersSet = new Set();
			for (let k = dateOffset; T > 0; k--, T--) {
				if (usersListsMap[k]) {
					usersListsMap[k].forEach((userId) => usersSet.add(userId));
				}
			}
			array[dateOffset].y = usersSet.size;
		};

		for (let i = 0; i < 30; i++) {
			distributeValueOverPoints(usersListsMap, i, 7, wauValues);
			distributeValueOverPoints(usersListsMap, i, 30, mauValues);
		}
		prevWauValue.y = wauValues[28].y;
		prevMauValue.y = mauValues[28].y;
		prevDauValue.y = dauValues[28].y;

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

	const downloadData = () => {
		const data = [{
			countDailyActiveUsers,
			diffDailyActiveUsers,
			countWeeklyActiveUsers,
			diffWeeklyActiveUsers,
			countMonthlyActiveUsers,
			diffMonthlyActiveUsers,
			dauValues,
			wauValues,
			mauValues,
		}];
		downloadCsvAs(data, `ActiveUsersSection_start_${ params.start }_end_${ params.end }`);
	};


	return <Section title={t('Active_users')} filter={<ActionButton small disabled={!data} onClick={downloadData} aria-label={t('Download_Info')} icon='download'/>}>
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
							<Box style={{
								position: 'absolute',
								width: '100%',
								height: '100%',
							}}>
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
										<Box>
											<Box>{formatDate(points[0].data.x)}</Box>
											{points.map(({ serieId, data: { y: activeUsers } }) =>
												<Box key={serieId} fontScale='p2'>
													<Box>{(serieId === 'dau' && t('DAU_value', { value: activeUsers }))
													|| (serieId === 'wau' && t('WAU_value', { value: activeUsers }))
													|| (serieId === 'mau' && t('MAU_value', { value: activeUsers }))}</Box>
												</Box>)}
										</Box>
									</Tile>}
								/>
							</Box>
						</Box>
					</Flex.Item>
				</Box>
				: <Skeleton variant='rect' height={240} />}
		</Flex.Container>
	</Section>;
};

export default ActiveUsersSection;
