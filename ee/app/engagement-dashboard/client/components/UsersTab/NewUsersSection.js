import { ResponsiveBar } from '@nivo/bar';
import { Box, Flex, Select, Skeleton, ActionButton } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import moment from 'moment';
import React, { useMemo, useState } from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { useEndpointData } from '../../../../../../client/hooks/useEndpointData';
import { useFormatDate } from '../../../../../../client/hooks/useFormatDate';
import CounterSet from '../../../../../../client/components/data/CounterSet';
import { Section } from '../Section';
import { downloadCsvAs } from '../../../../../../client/lib/download';

const TICK_WIDTH = 45;

const NewUsersSection = ({ timezone }) => {
	const t = useTranslation();
	const utc = timezone === 'utc';

	const periodOptions = useMemo(() => [
		['last 7 days', t('Last_7_days')],
		['last 30 days', t('Last_30_days')],
		['last 90 days', t('Last_90_days')],
	], [t]);

	const [periodId, setPeriodId] = useState('last 7 days');

	const formatDate = useFormatDate();

	const period = useMemo(() => {
		switch (periodId) {
			case 'last 7 days':
				return {
					start: utc
						? moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(7, 'days').utc()
						: moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(7, 'days'),
					end: utc
						? moment.utc().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(1, 'days').utc()
						: moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(1, 'days'),
				};

			case 'last 30 days':
				return {
					start: utc
						? moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(30, 'days').utc()
						: moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(30, 'days'),
					end: utc
						? moment.utc().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(1, 'days').utc()
						: moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(1, 'days'),
				};

			case 'last 90 days':
				return {
					start: utc
						? moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(90, 'days').utc()
						: moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(90, 'days'),
					end: utc
						? moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(1, 'days').utc()
						: moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(1, 'days'),
				};
		}
	}, [periodId, utc]);

	const handlePeriodChange = (periodId) => setPeriodId(periodId);

	const params = useMemo(() => ({
		start: period.start.toISOString(),
		end: period.end.toISOString(),
	}), [period]);

	const { value: data } = useEndpointData('engagement-dashboard/users/new-users', useMemo(() => params, [params]));

	const { ref: sizeRef, contentBoxSize: { inlineSize = 600 } = {} } = useResizeObserver();

	const maxTicks = Math.ceil(inlineSize / TICK_WIDTH);

	const tickValues = useMemo(() => {
		const arrayLength = moment(period.end).diff(period.start, 'days') + 1;
		if (arrayLength <= maxTicks || !maxTicks) {
			return null;
		}

		const values = Array.from({ length: arrayLength }, (_, i) => moment(period.start).add(i, 'days').toISOString());

		const relation = Math.ceil(values.length / maxTicks);

		return values.reduce((acc, cur, i) => {
			if ((i + 1) % relation === 0) { acc = [...acc, cur]; }
			return acc;
		}, []);
	}, [period, maxTicks]);

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
			newUsers: 0,
		}));
		for (const { day, users } of data.days) {
			const i = utc
				? moment(day).utc().diff(period.start, 'days')
				: moment(day).diff(period.start, 'days');
			if (i >= 0) {
				values[i].newUsers += users;
			}
		}

		return [
			data.period.count,
			data.period.variation,
			data.yesterday.count,
			data.yesterday.variation,
			values,
		];
	}, [data, period, utc]);

	const downloadData = () => {
		const data = values.map(({ data, newUsers }) => [data, newUsers]);
		downloadCsvAs(data, `NewUsersSection_start_${ params.start }_end_${ params.end }`);
	};

	return <Section
		title={t('New_users')}
		filter={<><Select small options={periodOptions} value={periodId} onChange={handlePeriodChange} /><ActionButton small mis='x16' disabled={!data} onClick={downloadData} aria-label={t('Download_Info')} icon='download'/></>}
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
						<Box style={{ position: 'relative' }} ref={sizeRef}>
							<Box style={{
								position: 'absolute',
								width: '100%',
								height: '100%',
							}}>
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
										'#1d74f5',
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
										format: (date) => moment(date).format(values.length === 7 ? 'dddd' : 'DD/MM'),
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
									tooltip={({ value, indexValue }) => <Box fontScale='p2' color='alternative'>
										{t('Value_users', { value })}, {formatDate(indexValue)}
									</Box>}
								/>
							</Box>
						</Box>
					</Flex.Item>
				</Box>
				: <Box ref={sizeRef}><Skeleton variant='rect' height={240}/></Box>}
		</Flex.Container>
	</Section>;
};

export default NewUsersSection;
