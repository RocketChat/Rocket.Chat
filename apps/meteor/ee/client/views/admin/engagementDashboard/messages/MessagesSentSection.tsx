import { ResponsiveBar } from '@nivo/bar';
import { Box, Flex, Skeleton } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import { useTranslation } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import React, { ReactElement, useMemo } from 'react';

import CounterSet from '../../../../../../client/components/dataView/CounterSet';
import Section from '../Section';
import DownloadDataButton from '../dataView/DownloadDataButton';
import PeriodSelector from '../dataView/PeriodSelector';
import { usePeriodLabel } from '../dataView/usePeriodLabel';
import { usePeriodSelectorState } from '../dataView/usePeriodSelectorState';
import { useMessagesSent } from './useMessagesSent';

const MessagesSentSection = (): ReactElement => {
	const [period, periodSelectorProps] = usePeriodSelectorState('last 7 days', 'last 30 days', 'last 90 days');
	const periodLabel = usePeriodLabel(period);

	const t = useTranslation();

	const { data } = useMessagesSent({ period });

	const [countFromPeriod, variatonFromPeriod, countFromYesterday, variationFromYesterday, values] = useMemo(() => {
		if (!data) {
			return [];
		}

		const values = Array.from({ length: moment(data.end).diff(data.start, 'days') + 1 }, (_, i) => ({
			date: moment(data.start).add(i, 'days').toISOString(),
			newMessages: 0,
		}));

		for (const { day, messages } of data.days ?? []) {
			const i = moment(day).diff(data.start, 'days');
			if (i >= 0) {
				values[i].newMessages += messages;
			}
		}

		return [data.period?.count, data.period?.variation, data.yesterday?.count, data.yesterday?.variation, values];
	}, [data]);

	return (
		<Section
			title={t('Messages_sent')}
			filter={
				<>
					<PeriodSelector {...periodSelectorProps} />
					<DownloadDataButton
						attachmentName={`MessagesSentSection_start_${data?.start}_end_${data?.end}`}
						headers={['Date', 'Messages']}
						dataAvailable={!!data}
						dataExtractor={(): unknown[][] | undefined => values?.map(({ date, newMessages }) => [date, newMessages])}
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
							<Box style={{ position: 'relative' }}>
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
										keys={['newMessages']}
										groupMode='grouped'
										padding={0.25}
										margin={{
											// TODO: Get it from theme
											bottom: 20,
										}}
										colors={[
											// TODO: Get it from theme
											colors.b500,
										]}
										enableLabel={false}
										enableGridY={false}
										axisTop={null}
										axisRight={null}
										axisBottom={
											(values.length === 7 && {
												tickSize: 0,
												// TODO: Get it from theme
												tickPadding: 4,
												tickRotation: 0,
												format: (date): string => moment(date).format('dddd'),
											}) ||
											null
										}
										axisLeft={null}
										animate={true}
										// @ts-ignore
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
												container: {
													backgroundColor: colors.n900,
													boxShadow: '0px 0px 12px rgba(47, 52, 61, 0.12), 0px 0px 2px rgba(47, 52, 61, 0.08)',
													borderRadius: 2,
												},
											},
										}}
										tooltip={({ value }): ReactElement => (
											<Box fontScale='p1m' color='alternative'>
												{t('Value_messages', { value })}
											</Box>
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
		</Section>
	);
};

export default MessagesSentSection;
