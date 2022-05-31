import { ResponsiveHeatMap } from '@nivo/heatmap';
import { Box, Flex, Skeleton } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import { useTranslation } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import React, { ReactElement, useMemo } from 'react';

import Section from '../Section';
import DownloadDataButton from '../dataView/DownloadDataButton';
import PeriodSelector from '../dataView/PeriodSelector';
import { usePeriodSelectorState } from '../dataView/usePeriodSelectorState';
import { useUsersByTimeOfTheDay } from './useUsersByTimeOfTheDay';

type UsersByTimeOfTheDaySectionProps = {
	timezone: 'utc' | 'local';
};

const UsersByTimeOfTheDaySection = ({ timezone }: UsersByTimeOfTheDaySectionProps): ReactElement => {
	const [period, periodSelectorProps] = usePeriodSelectorState('last 7 days', 'last 30 days', 'last 90 days');

	const utc = timezone === 'utc';

	const { data } = useUsersByTimeOfTheDay({ period, utc });

	const t = useTranslation();

	const [dates, values] = useMemo(() => {
		if (!data) {
			return [];
		}

		const dates = Array.from(
			{
				length: utc ? moment(data.end).diff(data.start, 'days') + 1 : moment(data.end).diff(data.start, 'days') - 1,
			},
			(_, i) =>
				utc
					? moment.utc(data.start).endOf('day').add(i, 'days')
					: moment(data.start)
							.endOf('day')
							.add(i + 1, 'days'),
		);

		const values = Array.from(
			{ length: 24 },
			(_, hour) =>
				({
					hour: String(hour),
					...dates.map((date) => ({ [date.toISOString()]: 0 })).reduce((obj, elem) => ({ ...obj, ...elem }), {}),
				} as { [date: string]: number } & { hour: string }),
		);

		const timezoneOffset = moment().utcOffset() / 60;

		for (const { users, hour, day, month, year } of data.week) {
			const date = utc ? moment.utc([year, month - 1, day, hour]) : moment([year, month - 1, day, hour]).add(timezoneOffset, 'hours');

			if (utc || (!date.isSame(data.end) && !date.clone().startOf('day').isSame(data.start))) {
				values[date.hour()][date.endOf('day').toISOString()] += users;
			}
		}

		return [dates.map((date) => date.toISOString()), values];
	}, [data, utc]);

	return (
		<Section
			title={t('Users_by_time_of_day')}
			filter={
				<>
					<PeriodSelector {...periodSelectorProps} />
					<DownloadDataButton
						attachmentName={`UsersByTimeOfTheDaySection_start_${data?.start}_end_${data?.end}`}
						headers={['Date', 'Users']}
						dataAvailable={!!data}
						dataExtractor={(): unknown[][] | undefined =>
							data?.week
								?.map(({ users, hour, day, month, year }) => ({
									date: moment([year, month - 1, day, hour, 0, 0, 0]),
									users,
								}))
								?.sort((a, b) => a.date.diff(b.date))
								?.map(({ date, users }) => [date.toISOString(), users])
						}
					/>
				</>
			}
		>
			{values ? (
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
								<ResponsiveHeatMap
									data={values}
									indexBy='hour'
									keys={dates}
									padding={4}
									margin={{
										// TODO: Get it from theme
										left: 60,
										bottom: 20,
									}}
									colors={[
										// TODO: Get it from theme
										colors.b100,
										colors.b200,
										colors.b300,
										colors.b400,
										colors.b500,
										colors.b600,
										colors.b700,
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
										format: (isoString): string => (dates?.length === 7 ? moment(isoString).format('dddd') : ''),
									}}
									axisLeft={{
										// TODO: Get it from theme
										tickSize: 0,
										tickPadding: 4,
										tickRotation: 0,
										format: (hour): string =>
											moment()
												.set({ hour: parseInt(hour, 10), minute: 0, second: 0 })
												.format('LT'),
									}}
									hoverTarget='cell'
									animate={dates && dates.length <= 7}
									motionStiffness={90}
									motionDamping={15}
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
									tooltip={({ value }): ReactElement => (
										<Box fontScale='p1m' color='alternative'>
											{t('Value_users', { value })}
										</Box>
									)}
								/>
							</Box>
						</Box>
					</Flex.Item>
				</Box>
			) : (
				<Skeleton variant='rect' height={696} />
			)}
		</Section>
	);
};

export default UsersByTimeOfTheDaySection;
