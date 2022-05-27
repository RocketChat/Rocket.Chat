import { ResponsiveBar } from '@nivo/bar';
import { Box, Flex, Skeleton } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import { useTranslation } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import React, { ReactElement, useMemo } from 'react';

import CounterSet from '../../../../../../client/components/dataView/CounterSet';
import { useFormatDate } from '../../../../../../client/hooks/useFormatDate';
import Section from '../Section';
import DownloadDataButton from '../dataView/DownloadDataButton';
import PeriodSelector from '../dataView/PeriodSelector';
import { usePeriodLabel } from '../dataView/usePeriodLabel';
import { usePeriodSelectorState } from '../dataView/usePeriodSelectorState';
import { useNewUsers } from './useNewUsers';

const TICK_WIDTH = 45;

type NewUsersSectionProps = {
	timezone: 'utc' | 'local';
};

const NewUsersSection = ({ timezone }: NewUsersSectionProps): ReactElement => {
	const [period, periodSelectorProps] = usePeriodSelectorState('last 7 days', 'last 30 days', 'last 90 days');
	const periodLabel = usePeriodLabel(period);

	const utc = timezone === 'utc';
	const { data } = useNewUsers({ period, utc });

	const t = useTranslation();

	const formatDate = useFormatDate();

	const { ref: sizeRef, contentBoxSize: { inlineSize = 600 } = {} } = useResizeObserver();

	const maxTicks = Math.ceil(inlineSize / TICK_WIDTH);

	const tickValues = useMemo(() => {
		if (!data) {
			return undefined;
		}

		const arrayLength = moment(data.end).diff(data.start, 'days') + 1;
		if (arrayLength <= maxTicks || !maxTicks) {
			return undefined;
		}

		const values = Array.from({ length: arrayLength }, (_, i) => moment(data.start).add(i, 'days').format('YYYY-MM-DD'));

		const relation = Math.ceil(values.length / maxTicks);

		return values.reduce((acc, cur, i) => {
			if ((i + 1) % relation === 0) {
				acc = [...acc, cur];
			}
			return acc;
		}, [] as string[]);
	}, [data, maxTicks]);

	const [countFromPeriod, variatonFromPeriod, countFromYesterday, variationFromYesterday, values] = useMemo(() => {
		if (!data) {
			return [];
		}

		const values = Array.from({ length: moment(data.end).diff(data.start, 'days') + 1 }, (_, i) => ({
			date: moment(data.start).add(i, 'days').format('YYYY-MM-DD'),
			newUsers: 0,
		}));
		for (const { day, users } of data.days) {
			const i = utc ? moment(day).utc().diff(data.start, 'days') : moment(day).diff(data.start, 'days');
			if (i >= 0) {
				values[i].newUsers += users;
			}
		}

		return [data.period.count, data.period.variation, data.yesterday.count, data.yesterday.variation, values];
	}, [data, utc]);

	return (
		<Section
			title={t('New_users')}
			filter={
				<>
					<PeriodSelector {...periodSelectorProps} />
					<DownloadDataButton
						attachmentName={`NewUsersSection_start_${data?.start}_end_${data?.end}`}
						headers={['Date', 'New Users']}
						dataAvailable={!!data}
						dataExtractor={(): unknown[][] | undefined => values?.map(({ date, newUsers }) => [date, newUsers])}
					/>
				</>
			}
		>
			<CounterSet
				counters={[
					{
						count: countFromPeriod ?? <Skeleton variant='rect' width='3ex' height='1em' />,
						variation: variatonFromPeriod ?? 0,
						description: periodLabel,
					},
					{
						count: countFromYesterday ?? <Skeleton variant='rect' width='3ex' height='1em' />,
						variation: variationFromYesterday ?? 0,
						description: t('Yesterday'),
					},
				]}
			/>
			<Flex.Container>
				{values ? (
					<Box style={{ height: 240 }}>
						<Flex.Item align='stretch' grow={1} shrink={0}>
							<Box style={{ position: 'relative' }} ref={sizeRef}>
								<Box
									style={{
										position: 'absolute',
										width: '100%',
										height: '100%',
									}}
								>
									<ResponsiveBar
										data={values}
										indexBy='date'
										keys={['newUsers']}
										groupMode='grouped'
										padding={0.25}
										margin={{
											// TODO: Get it from theme
											bottom: 20,
											left: 20,
											top: 20,
										}}
										colors={[
											// TODO: Get it from theme
											colors.b500,
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
											tickValues,
											format: (date): string => moment(date).format(values?.length === 7 ? 'dddd' : 'DD/MM'),
										}}
										axisLeft={{
											tickSize: 0,
											// TODO: Get it from theme
											tickPadding: 4,
											tickRotation: 0,
										}}
										animate={true}
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
														fontSize: '10px',
														fontStyle: 'normal',
														fontWeight: 600,
														letterSpacing: '0.2px',
														lineHeight: '12px',
													},
												},
											},
											tooltip: {
												// @ts-ignore
												backgroundColor: colors.n900,
												boxShadow: '0px 0px 12px rgba(47, 52, 61, 0.12), 0px 0px 2px rgba(47, 52, 61, 0.08)',
												borderRadius: 2,
												padding: 4,
											},
										}}
										tooltip={({ value, indexValue }): ReactElement => (
											<Box fontScale='p1m' color='alternative'>
												{t('Value_users', { value })}, {formatDate(indexValue)}
											</Box>
										)}
									/>
								</Box>
							</Box>
						</Flex.Item>
					</Box>
				) : (
					<Box ref={sizeRef}>
						<Skeleton variant='rect' height={240} />
					</Box>
				)}
			</Flex.Container>
		</Section>
	);
};

export default NewUsersSection;
