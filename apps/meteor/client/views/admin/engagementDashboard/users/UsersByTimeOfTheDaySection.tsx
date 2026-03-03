import type { ComputedCell, DefaultHeatMapDatum } from '@nivo/heatmap';
import { ResponsiveHeatMapCanvas } from '@nivo/heatmap';
import { Box, Flex, Skeleton, Tooltip } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import { differenceInDays, addDays, endOfDay, format, isSameDay } from 'date-fns';
import type { ReactElement } from 'react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useUsersByTimeOfTheDay } from './useUsersByTimeOfTheDay';
import DownloadDataButton from '../../../../components/dashboards/DownloadDataButton';
import PeriodSelector from '../../../../components/dashboards/PeriodSelector';
import { usePeriodSelectorState } from '../../../../components/dashboards/usePeriodSelectorState';
import EngagementDashboardCardFilter from '../EngagementDashboardCardFilter';

type UsersByTimeOfTheDaySectionProps = {
	timezone: 'utc' | 'local';
};

function endOfDayUTC(d: Date): Date {
	return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

const UsersByTimeOfTheDaySection = ({ timezone }: UsersByTimeOfTheDaySectionProps): ReactElement => {
	const [period, periodSelectorProps] = usePeriodSelectorState('last 7 days', 'last 30 days', 'last 90 days');

	const utc = timezone === 'utc';

	const { data, isPending } = useUsersByTimeOfTheDay({ period, utc });

	const { t } = useTranslation();

	const [dates, values] = useMemo(() => {
		if (!data || isPending) {
			return [];
		}

		const startDate = new Date(data.start);
		const endDate = new Date(data.end);
		const length = utc ? differenceInDays(endDate, startDate) + 1 : differenceInDays(endDate, startDate) - 1;
		const start = utc ? endOfDayUTC(startDate) : addDays(endOfDay(startDate), 1);

		const datesArray = new Array(length);
		for (let i = 0; i < length; i++) {
			datesArray[i] = addDays(start, i).toISOString();
		}

		const valuesArray = new Array(24);
		for (let hour = 0; hour < 24; hour++) {
			valuesArray[hour] = {
				id: hour.toString(),
				data: datesArray.map((x) => ({ x, y: 0 })),
			};
		}

		const timezoneOffsetHours = -new Date().getTimezoneOffset() / 60;

		for (const { users, hour, day, month, year } of data.week) {
			const d = utc ? new Date(Date.UTC(year, month - 1, day, hour, 0, 0, 0)) : new Date(year, month - 1, day, hour, 0, 0, 0);
			if (!utc) {
				d.setHours(d.getHours() + timezoneOffsetHours);
			}

			const include = utc || (!isSameDay(d, endDate) && !isSameDay(new Date(d.getFullYear(), d.getMonth(), d.getDate()), startDate));
			if (include) {
				const dateEnd = endOfDay(d);
				const dateKey = dateEnd.toISOString();
				const hourIdx = d.getHours();
				const dataPoint = valuesArray[hourIdx].data.find((point: { x: string }) => point.x === dateKey);
				if (dataPoint) {
					dataPoint.y += users;
				}
			}
		}

		return [datesArray, valuesArray];
	}, [data, isPending, utc]);

	const tooltip = useCallback(
		({ cell }: { cell: ComputedCell<DefaultHeatMapDatum> }) => {
			return (
				<Tooltip>
					{format(new Date(cell.data.x), 'EEE')} {format(new Date(2000, 0, 1, parseInt(cell.serieId, 10), 0, 0), 'p')}
					<br />
					{t('Value_users', { value: cell.data.y })}
				</Tooltip>
			);
		},
		[t],
	);

	return (
		<>
			<EngagementDashboardCardFilter>
				<PeriodSelector {...periodSelectorProps} />
				<DownloadDataButton
					attachmentName={`UsersByTimeOfTheDaySection_start_${data?.start}_end_${data?.end}`}
					headers={['Date', 'Users']}
					dataAvailable={!!data}
					dataExtractor={(): unknown[][] | undefined =>
						data?.week
							?.map(({ users, hour, day, month, year }) => ({
								date: new Date(year, month - 1, day, hour, 0, 0, 0),
								users,
							}))
							?.sort((a, b) => a.date.getTime() - b.date.getTime())
							?.map(({ date, users }) => [date.toISOString(), users])
					}
				/>
			</EngagementDashboardCardFilter>

			{!isPending && values && dates ? (
				<Box display='flex' style={{ height: 696 }}>
					<Flex.Item align='stretch' grow={1} shrink={0}>
						<Box style={{ position: 'relative' }}>
							<Box
								style={{
									position: 'absolute',
									width: '100%',
									height: '100%',
								}}
							>
								<ResponsiveHeatMapCanvas
									data={values}
									xInnerPadding={0.1}
									yInnerPadding={0.25}
									margin={{
										// TODO: Get it from theme
										left: 60,
										bottom: 20,
									}}
									colors={{
										type: 'quantize',
										colors: [
											// TODO: Get it from theme
											colors.b100,
											colors.b200,
											colors.b300,
											colors.b400,
											colors.b500,
											colors.b600,
											colors.b700,
										],
									}}
									emptyColor='transparent'
									enableLabels={false}
									axisTop={null}
									axisRight={null}
									axisBottom={{
										// TODO: Get it from theme
										tickSize: 0,
										tickPadding: 8,
										tickRotation: 0,
										format: (isoString): string => (dates?.length === 8 ? format(new Date(isoString), 'EEE') : ''),
									}}
									axisLeft={{
										// TODO: Get it from theme
										tickSize: 0,
										tickPadding: 8,
										tickRotation: 0,
										format: (hour): string => format(new Date(2000, 0, 1, parseInt(hour, 10), 0, 0), 'p'),
									}}
									hoverTarget='cell'
									animate={dates && dates.length <= 7}
									motionConfig='stiff'
									theme={{
										// TODO: Get it from theme
										axis: {
											ticks: {
												text: {
													fill: colors.n600,
													fontFamily:
														'Inter, -apple-system, system-ui, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Meiryo UI", Arial, sans-serif',
													fontSize: 10,
													fontStyle: 'normal',
													fontWeight: 600,
													letterSpacing: '0.2px',
													lineHeight: '12px',
												},
											},
										},
										tooltip: {
											container: {
												backgroundColor: colors.n900,
												boxShadow: '0px 0px 12px rgba(47, 52, 61, 0.12), 0px 0px 2px rgba(47, 52, 61, 0.08)',
												borderRadius: 2,
											},
										},
									}}
									tooltip={tooltip}
								/>
							</Box>
						</Box>
					</Flex.Item>
				</Box>
			) : (
				<Skeleton variant='rect' height={696} />
			)}
		</>
	);
};

export default UsersByTimeOfTheDaySection;
