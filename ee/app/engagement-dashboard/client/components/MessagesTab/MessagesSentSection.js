import { ResponsiveBar } from '@nivo/bar';
import { Box, Flex, Select, Skeleton, ActionButton } from '@rocket.chat/fuselage';
import moment from 'moment';
import React, { useMemo, useState } from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { useEndpointData } from '../../../../../../client/hooks/useEndpointData';
import CounterSet from '../../../../../../client/components/data/CounterSet';
import { Section } from '../Section';
import { downloadCsvAs } from '../../../../../../client/lib/download';

export function MessagesSentSection() {
	const t = useTranslation();

	const periodOptions = useMemo(() => [
		['last 7 days', t('Last_7_days')],
		['last 30 days', t('Last_30_days')],
		['last 90 days', t('Last_90_days')],
	], [t]);

	const [periodId, setPeriodId] = useState('last 7 days');

	const period = useMemo(() => {
		switch (periodId) {
			case 'last 7 days':
				return {
					start: moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(7, 'days'),
					end: moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(1),
				};

			case 'last 30 days':
				return {
					start: moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(30, 'days'),
					end: moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(1),
				};

			case 'last 90 days':
				return {
					start: moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(90, 'days'),
					end: moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(1),
				};
		}
	}, [periodId]);

	const handlePeriodChange = (periodId) => setPeriodId(periodId);

	const params = useMemo(() => ({
		start: period.start.toISOString(),
		end: period.end.toISOString(),
	}), [period]);

	const { value: data } = useEndpointData('engagement-dashboard/messages/messages-sent', params);

	const [
		countFromPeriod,
		variatonFromPeriod,
		countFromYesterday,
		variationFromYesterday,
		values,
	] = useMemo(() => {
		if (!data) {
			return [];
		}

		const values = Array.from({ length: moment(period.end).diff(period.start, 'days') + 1 }, (_, i) => ({
			date: moment(period.start).add(i, 'days').toISOString(),
			newMessages: 0,
		}));
		for (const { day, messages } of data.days) {
			const i = moment(day).diff(period.start, 'days');
			if (i >= 0) {
				values[i].newMessages += messages;
			}
		}

		return [
			data.period.count,
			data.period.variation,
			data.yesterday.count,
			data.yesterday.variation,
			values,
		];
	}, [data, period]);

	const downloadData = () => {
		const data = values.map(({ date, newMessages }) => [date, newMessages]);
		downloadCsvAs(data, `MessagesSentSection_start_${ params.start }_end_${ params.end }`);
	};

	return <Section
		title={t('Messages_sent')}
		filter={<><Select options={periodOptions} value={periodId} onChange={handlePeriodChange} /><ActionButton small mis='x16' disabled={!data} onClick={downloadData} aria-label={t('Download_Info')} icon='download'/></>}
	>
		<CounterSet
			counters={[
				{
					count: data ? countFromPeriod : <Skeleton variant='rect' width='3ex' height='1em' />,
					variation: data ? variatonFromPeriod : 0,
					description: periodOptions.find(([id]) => id === periodId)[1],
				},
				{
					count: data ? countFromYesterday : <Skeleton variant='rect' width='3ex' height='1em' />,
					variation: data ? variationFromYesterday : 0,
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
										'#1d74f5',
									]}
									enableLabel={false}
									enableGridY={false}
									axisTop={null}
									axisRight={null}
									axisBottom={(values.length === 7 && {
										tickSize: 0,
										// TODO: Get it from theme
										tickPadding: 4,
										tickRotation: 0,
										format: (date) => moment(date).format('dddd'),
									}) || null }
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
										tooltip: {
											container: {
												backgroundColor: '#1F2329',
												boxShadow: '0px 0px 12px rgba(47, 52, 61, 0.12), 0px 0px 2px rgba(47, 52, 61, 0.08)',
												borderRadius: 2,
											},
										},
									}}
									tooltip={({ value }) => <Box fontScale='p2' color='alternative'>
										{t('Value_messages', { value })}
									</Box>}
								/>
							</Box>
						</Box>
					</Flex.Item>
				</Box>
				: <Skeleton variant='rect' height={240} />}
		</Flex.Container>
	</Section>;
}
