import { ResponsiveBar } from '@nivo/bar';
import { Box, Flex, IconButton, Margins, Skeleton } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import moment from 'moment';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import { useWeeklyChatActivity } from './useWeeklyChatActivity';

type ContentForDaysProps = {
	displacement: number;
	onPreviousDateClick: () => void;
	onNextDateClick: () => void;
	timezone: 'utc' | 'local';
};

const ContentForDays = ({ displacement, onPreviousDateClick, onNextDateClick, timezone }: ContentForDaysProps): ReactElement => {
	const utc = timezone === 'utc';
	const { data } = useWeeklyChatActivity({ displacement, utc });

	const formattedCurrentDate = useMemo(() => {
		if (!data) {
			return null;
		}

		const endOfWeek = moment(data.day);
		const startOfWeek = moment(data.day).subtract(6, 'days');
		return `${startOfWeek.format('L')} - ${endOfWeek.format('L')}`;
	}, [data]);

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
					<IconButton icon='chevron-down' small onClick={onPreviousDateClick} style={{ verticalAlign: 'middle' }} />
					<Flex.Item basis='50%'>
						<Margins inline='x8'>
							<Box is='span' style={{ textAlign: 'center' }}>
								{formattedCurrentDate}
							</Box>
						</Margins>
					</Flex.Item>
					<IconButton icon='chevron-down' small disabled={displacement === 0} onClick={onNextDateClick} />
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
											colors.p500,
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
