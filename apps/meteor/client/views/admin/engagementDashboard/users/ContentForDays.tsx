import { ResponsiveBar } from '@nivo/bar';
import { Box, Flex, IconButton, Margins, Skeleton } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import { format, subDays } from 'date-fns';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { useWeeklyChatActivity } from './useWeeklyChatActivity';
import { formatDate } from '../../../../lib/utils/dateFormat';

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

		const dayDate = new Date(data.day);
		const endOfWeek = dayDate;
		const startOfWeek = subDays(dayDate, 6);
		return `${format(startOfWeek, 'P')} - ${format(endOfWeek, 'P')}`;
	}, [data]);

	const values = useMemo(
		() =>
			data?.month
				?.map(({ users, day, month, year }) => ({
					users,
					day: new Date(year, month - 1, day).getTime(),
				}))
				?.sort((a, b) => a.day - b.day)
				?.map(({ users, day }) => ({ users, day: String(day) })) ?? [],
		[data],
	);

	return (
		<>
			<Flex.Container alignItems='center' justifyContent='center'>
				<Box>
					<IconButton icon='chevron-down' verticalAlign='middle' small onClick={onPreviousDateClick} />
					<Flex.Item basis='50%'>
						<Margins inline={8}>
							<Box is='span' textAlign='center'>
								{formattedCurrentDate}
							</Box>
						</Margins>
					</Flex.Item>
					<IconButton icon='chevron-down' small disabled={displacement === 0} onClick={onNextDateClick} />
				</Box>
			</Flex.Container>
			<Flex.Container>
				{data ? (
					<Box height={196}>
						<Flex.Item align='stretch' grow={1} shrink={0}>
							<Box position='relative'>
								<Box position='absolute' width='full' height='full'>
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
											format: (timestamp): string => formatDate(parseInt(timestamp, 10), 'L'),
										}}
										axisLeft={null}
										animate={true}
										motionConfig='stiff'
										theme={{
											// TODO: Get it from theme
											axis: {
												ticks: {
													text: {
														fill: colors.n600,
														fontFamily:
															'Inter, -apple-system, system-ui, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Meiryo UI", Arial, sans-serif',
													},
												},
											},
										}}
										role='img'
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
