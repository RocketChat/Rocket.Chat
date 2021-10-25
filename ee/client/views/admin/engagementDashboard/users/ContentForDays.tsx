import { ResponsiveBar } from '@nivo/bar';
import { Box, Button, Chevron, Flex, Margins, Skeleton } from '@rocket.chat/fuselage';
import moment from 'moment';
import React, { ReactElement, useMemo } from 'react';

import { useEndpointData } from '../../../../../../client/hooks/useEndpointData';

type ContentForDaysProps = {
	displacement: number;
	onPreviousDateClick: () => void;
	onNextDateClick: () => void;
	timezone: 'utc' | 'local';
};

const ContentForDays = ({
	displacement,
	onPreviousDateClick,
	onNextDateClick,
	timezone,
}: ContentForDaysProps): ReactElement => {
	const utc = timezone === 'utc';

	const currentDate = useMemo(() => {
		if (utc) {
			return moment.utc().subtract(displacement, 'weeks');
		}
		return moment().subtract(displacement, 'weeks');
	}, [displacement, utc]);

	const formattedCurrentDate = useMemo(() => {
		const startOfWeekDate = currentDate.clone().subtract(6, 'days');
		return `${startOfWeekDate.format('L')} - ${currentDate.format('L')}`;
	}, [currentDate]);

	const params = useMemo(() => ({ start: currentDate.toISOString() }), [currentDate]);

	const { value: data } = useEndpointData(
		'engagement-dashboard/users/chat-busier/weekly-data',
		useMemo(() => params, [params]),
	);

	const values = useMemo(
		() =>
			data?.month
				?.map(({ users, day, month, year }) => ({
					users,
					day: moment({ year, month: month - 1, day }),
				}))
				?.sort(({ day: a }, { day: b }) => a.diff(b))
				?.map(({ users, day }) => ({ users, day: String(day.valueOf()) })) ?? [],
		[data],
	);

	return (
		<>
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
				{data ? (
					<Box style={{ height: 196 }}>
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
											format: (timestamp): string => moment(parseInt(timestamp, 10)).format('L'),
										}}
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
										}}
									/>
								</Box>
							</Box>
						</Flex.Item>
					</Box>
				) : (
					<Skeleton variant='rect' height={196} />
				)}
			</Flex.Container>
		</>
	);
};

export default ContentForDays;
