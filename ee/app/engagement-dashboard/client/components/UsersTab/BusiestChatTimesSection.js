import { ResponsiveBar } from '@nivo/bar';
import { Box, Button, Chevron, Flex, Margins, Select, Skeleton } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import moment from 'moment';
import React, { useMemo, useState } from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { useEndpointData } from '../../../../../../client/hooks/useEndpointData';
import { Section } from '../Section';

const ContentForHours = ({ displacement, onPreviousDateClick, onNextDateClick, timezone }) => {
	const t = useTranslation();
	const isLgScreen = useBreakpoints().includes('lg');
	const utc = timezone === 'utc';

	const currentDate = useMemo(() => {
		if (utc) {
			return moment().utc({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(1, 'days').subtract(displacement, 'days');
		}
		return moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(1).subtract(displacement, 'days');
	}, [displacement, utc]);

	const params = useMemo(() => ({ start: currentDate.toISOString() }), [currentDate]);
	const { value: data } = useEndpointData('engagement-dashboard/users/chat-busier/hourly-data', useMemo(() => params, [params]));
	const values = useMemo(() => {
		if (!data) {
			return [];
		}

		const divider = 2;
		const values = Array.from({ length: 24 / divider }, (_, i) => ({
			hour: String(divider * i),
			users: 0,
		}));
		for (const { hour, users } of data.hours) {
			const i = Math.floor(hour / divider);
			values[i] = values[i] || { hour: String(divider * i), users: 0 };
			values[i].users += users;
		}

		return values;
	}, [data]);

	return <>
		<Box display='flex' alignItems='center' justifyContent='center'>
			<Button ghost square small onClick={onPreviousDateClick}>
				<Chevron left size='x20' style={{ verticalAlign: 'middle' }} />
			</Button>
			<Box mi='x8' flexBasis='25%' is='span' style={{ textAlign: 'center' }}>
				{currentDate.format(displacement < 7 ? 'dddd' : 'L')}
			</Box>
			<Button ghost square small disabled={displacement === 0} onClick={onNextDateClick}>
				<Chevron right size='x20' style={{ verticalAlign: 'middle' }} />
			</Button>
		</Box>
		{data
			? <Box display='flex' height='196px'>
				<Box align='stretch' flexGrow={1} flexShrink={0} position='relative'>
					<Box position='absolute' width='100%' height='100%'>
						<ResponsiveBar
							data={values}
							indexBy='hour'
							keys={['users']}
							groupMode='grouped'
							padding={0.25}
							margin={{
								// TODO: Get it from theme
								bottom: 30,
								right: 5,
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
								tickRotation: isLgScreen ? 0 : 25,
								tickValues: 'every 2 hours',
								format: (hour) => moment().set({ hour, minute: 0, second: 0 }).format('LT'),
							}}
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
								{t('Value_users', { value })}
							</Box>}
						/>
					</Box>
				</Box>
			</Box>
			: <Skeleton variant='rect' height={196} />}
	</>;
};

const ContentForDays = ({ displacement, onPreviousDateClick, onNextDateClick, timezone }) => {
	const utc = timezone === 'utc';
	const currentDate = useMemo(() => {
		if (utc) {
			return moment.utc().subtract(displacement, 'weeks');
		}
		return moment().subtract(displacement, 'weeks');
	}, [displacement, utc]);
	const formattedCurrentDate = useMemo(() => {
		const startOfWeekDate = currentDate.clone().subtract(6, 'days');
		return `${ startOfWeekDate.format('L') } - ${ currentDate.format('L') }`;
	}, [currentDate]);
	const params = useMemo(() => ({ start: currentDate.toISOString() }), [currentDate]);
	const { value: data } = useEndpointData('engagement-dashboard/users/chat-busier/weekly-data', useMemo(() => params, [params]));
	const values = useMemo(() => (data ? data.month.map(({ users, day, month, year }) => ({
		users,
		day: String(moment({ year, month: month - 1, day }).valueOf()),
	})).sort(({ day: a }, { day: b }) => a - b) : []), [data]);

	return <>
		<Flex.Container alignItems='center' justifyContent='center'>
			<Box>
				<Button ghost square small onClick={onPreviousDateClick}>
					<Chevron left size='x20' style={{ verticalAlign: 'middle' }} />
				</Button>
				<Flex.Item basis='50%'>
					<Margins inline='x8'>
						<Box is='span' style={{ textAlign: 'center' }}>
							{formattedCurrentDate}
						</Box>
					</Margins>
				</Flex.Item>
				<Button ghost square small disabled={displacement === 0} onClick={onNextDateClick}>
					<Chevron right size='x20' style={{ verticalAlign: 'middle' }} />
				</Button>
			</Box>
		</Flex.Container>
		<Flex.Container>
			{data
				? <Box style={{ height: 196 }}>
					<Flex.Item align='stretch' grow={1} shrink={0}>
						<Box style={{ position: 'relative' }}>
							<Box style={{
								position: 'absolute',
								width: '100%',
								height: '100%',
							}}>
								<ResponsiveBar
									data={values}
									indexBy='day'
									keys={['users']}
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
									axisBottom={{
										tickSize: 0,
										// TODO: Get it from theme
										tickPadding: 4,
										tickRotation: 0,
										tickValues: 'every 3 days',
										format: (timestamp) => moment(parseInt(timestamp, 10)).format('L'),
									}}
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
									}}
								/>
							</Box>
						</Box>
					</Flex.Item>
				</Box>
				: <Skeleton variant='rect' height={196} />}
		</Flex.Container>
	</>;
};

const BusiestChatTimesSection = ({ timezone }) => {
	const t = useTranslation();

	const [timeUnit, setTimeUnit] = useState('hours');
	const timeUnitOptions = useMemo(() => [
		['hours', t('Hours')],
		['days', t('Days')],
	], [t]);

	const [displacement, setDisplacement] = useState(0);

	const handleTimeUnitChange = (timeUnit) => {
		setTimeUnit(timeUnit);
		setDisplacement(0);
	};

	const handlePreviousDateClick = () => setDisplacement((displacement) => displacement + 1);
	const handleNextDateClick = () => setDisplacement((displacement) => displacement - 1);

	const Content = (timeUnit === 'hours' && ContentForHours) || (timeUnit === 'days' && ContentForDays);

	return <Section
		title={t('When_is_the_chat_busier?')}
		filter={<Select options={timeUnitOptions} value={timeUnit} onChange={handleTimeUnitChange} />}
	>
		<Content
			displacement={displacement}
			onPreviousDateClick={handlePreviousDateClick}
			onNextDateClick={handleNextDateClick}
			timezone={timezone}
		/>
	</Section>;
};

export default BusiestChatTimesSection;
