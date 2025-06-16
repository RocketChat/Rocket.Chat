import { ResponsiveLine } from '@nivo/line';
import { Box, Flex, Skeleton, Tile } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import moment from 'moment';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useActiveUsers } from './useActiveUsers';
import DownloadDataButton from '../../../../components/dashboards/DownloadDataButton';
import CounterSet from '../../../../components/dataView/CounterSet';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import EngagementDashboardCardFilter from '../EngagementDashboardCardFilter';
import LegendSymbol from '../dataView/LegendSymbol';

type ActiveUsersSectionProps = {
	timezone: 'utc' | 'local';
};

const ActiveUsersSection = ({ timezone }: ActiveUsersSectionProps): ReactElement => {
	const utc = timezone === 'utc';
	const { data } = useActiveUsers({ utc });

	const [
		countDailyActiveUsers,
		diffDailyActiveUsers,
		countWeeklyActiveUsers,
		diffWeeklyActiveUsers,
		countMonthlyActiveUsers,
		diffMonthlyActiveUsers,
		dauValues = [],
		wauValues = [],
		mauValues = [],
	] = useMemo(() => {
		if (!data) {
			return [];
		}

		const createPoint = (i: number): { x: Date; y: number } => ({
			x: moment(data.start).add(i, 'days').startOf('day').toDate(),
			y: 0,
		});

		const createPoints = (): { x: Date; y: number }[] =>
			Array.from({ length: moment(data.end).diff(data.start, 'days') }, (_, i) => createPoint(i));

		const dauValuesLocal = createPoints();
		const prevDauValue = createPoint(-1);
		const wauValuesLocal = createPoints();
		const prevWauValue = createPoint(-1);
		const mauValuesLocal = createPoints();
		const prevMauValue = createPoint(-1);

		const usersListsMap = data.month.reduce<{ [x: number]: string[] }>((map, dayData) => {
			const date = utc
				? moment.utc({ year: dayData.year, month: dayData.month - 1, day: dayData.day }).endOf('day')
				: moment({ year: dayData.year, month: dayData.month - 1, day: dayData.day }).endOf('day');
			const dateOffset = date.diff(data.start, 'days');
			if (dateOffset >= 0 && dauValuesLocal[dateOffset]) {
				map[dateOffset] = dayData.usersList;
				dauValuesLocal[dateOffset].y = dayData.users;
			}
			return map;
		}, {});

		const distributeValueOverPoints = (
			usersListsMap: { [x: number]: string[] },
			dateOffset: number,
			count: number,
			array: { x: Date; y: number }[],
		): void => {
			const usersSet = new Set();
			for (let k = dateOffset; count > 0; k--, count--) {
				if (usersListsMap[k]) {
					usersListsMap[k].map((userId) => usersSet.add(userId));
				}
			}

			array[dateOffset].y = usersSet.size;
		};

		for (let i = 0; i < dauValuesLocal.length; i++) {
			distributeValueOverPoints(usersListsMap, i, 7, wauValuesLocal);
			distributeValueOverPoints(usersListsMap, i, 30, mauValuesLocal);
		}
		prevWauValue.y = wauValuesLocal[dauValuesLocal.length - 2].y;
		prevMauValue.y = mauValuesLocal[dauValuesLocal.length - 2].y;
		prevDauValue.y = dauValuesLocal[dauValuesLocal.length - 2].y;

		return [
			dauValuesLocal[dauValuesLocal.length - 1].y,
			dauValuesLocal[dauValuesLocal.length - 1].y - prevDauValue.y,
			wauValuesLocal[wauValuesLocal.length - 1].y,
			wauValuesLocal[wauValuesLocal.length - 1].y - prevWauValue.y,
			mauValuesLocal[mauValuesLocal.length - 1].y,
			mauValuesLocal[mauValuesLocal.length - 1].y - prevMauValue.y,
			dauValuesLocal,
			wauValuesLocal,
			mauValuesLocal,
		];
	}, [data, utc]);

	const formatDate = useFormatDate();
	const { t } = useTranslation();

	return (
		<>
			<EngagementDashboardCardFilter>
				<DownloadDataButton
					attachmentName={`ActiveUsersSection_start_${data?.start}_end_${moment(data?.end).subtract(1, 'day')}`}
					headers={['Date', 'DAU', 'WAU', 'MAU']}
					dataAvailable={!!data}
					dataExtractor={(): unknown[][] | undefined => {
						const values = [];

						for (let i = 0; i < 30; i++) {
							values.push([dauValues[i].x.toISOString(), dauValues[i].y, wauValues[i].y, mauValues[i].y]);
						}

						return values;
					}}
				/>
			</EngagementDashboardCardFilter>
			<CounterSet
				counters={[
					{
						count: countDailyActiveUsers ?? <Skeleton variant='rect' width='3ex' height='1em' />,
						variation: diffDailyActiveUsers ?? 0,
						description: (
							<>
								<LegendSymbol color={colors.b200} /> {t('Daily_Active_Users')}
							</>
						),
					},
					{
						count: countWeeklyActiveUsers ?? <Skeleton variant='rect' width='3ex' height='1em' />,
						variation: diffWeeklyActiveUsers ?? 0,
						description: (
							<>
								<LegendSymbol color={colors.b300} /> {t('Weekly_Active_Users')}
							</>
						),
					},
					{
						count: countMonthlyActiveUsers ?? <Skeleton variant='rect' width='3ex' height='1em' />,
						variation: diffMonthlyActiveUsers ?? 0,
						description: (
							<>
								<LegendSymbol color={colors.p500} /> {t('Monthly_Active_Users')}
							</>
						),
					},
				]}
			/>
			<Flex.Container>
				{data ? (
					<Box style={{ height: 240 }}>
						<Flex.Item align='stretch' grow={1} shrink={0}>
							<Box style={{ position: 'relative' }}>
								<Box
									style={{
										position: 'absolute',
										width: '100%',
										height: '100%',
									}}
								>
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
										colors={[colors.b200, colors.b300, colors.b500]}
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
											format: (date): string => moment(date).format('DD/MM'),
										}}
										animate={true}
										motionConfig='stiff'
										theme={{
											// TODO: Get it from theme
											axis: {
												ticks: {
													text: {
														fill: '#9EA2A8',
														fontFamily:
															'Inter, -apple-system, system-ui, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Meiryo UI", Arial, sans-serif',
														fontSize: '10px',
														fontStyle: 'normal',
														fontWeight: 600,
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
										sliceTooltip={({ slice: { points } }): ReactElement => (
											<Tile elevation='2'>
												<Box>
													<Box>{formatDate(points[0].data.x)}</Box>
													{points.map(({ serieId, data: { y: activeUsers } }) => (
														<Box key={serieId} fontScale='p1m'>
															<Box>
																{(serieId === 'dau' && t('DAU_value', { value: activeUsers })) ||
																	(serieId === 'wau' && t('WAU_value', { value: activeUsers })) ||
																	(serieId === 'mau' && t('MAU_value', { value: activeUsers }))}
															</Box>
														</Box>
													))}
												</Box>
											</Tile>
										)}
									/>
								</Box>
							</Box>
						</Flex.Item>
					</Box>
				) : (
					<Skeleton variant='rect' height={240} />
				)}
			</Flex.Container>
		</>
	);
};

export default ActiveUsersSection;
