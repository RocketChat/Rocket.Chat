import { ResponsivePie } from '@nivo/pie';
import {
	Box,
	Flex,
	Icon,
	Margins,
	Skeleton,
	Table,
	Tile,
	Palette,
	Tooltip,
	TableHead,
	TableRow,
	TableBody,
	TableCell,
} from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import DownloadDataButton from '../../../../components/dashboards/DownloadDataButton';
import PeriodSelector from '../../../../components/dashboards/PeriodSelector';
import { usePeriodSelectorState } from '../../../../components/dashboards/usePeriodSelectorState';
import EngagementDashboardCardFilter from '../EngagementDashboardCardFilter';
import LegendSymbol from '../dataView/LegendSymbol';
import { useMessageOrigins } from './useMessageOrigins';
import { useTopFivePopularChannels } from './useTopFivePopularChannels';

const colors = {
	warning: Palette.statusColor['status-font-on-warning'].toString(),
	success: Palette.statusColor['status-font-on-success'].toString(),
	info: Palette.statusColor['status-font-on-info'].toString(),
};
const MessagesPerChannelSection = (): ReactElement => {
	const [period, periodSelectorProps] = usePeriodSelectorState('last 7 days', 'last 30 days', 'last 90 days');

	const t = useTranslation();

	const { data: messageOriginsData } = useMessageOrigins({ period });
	const { data: topFivePopularChannelsData } = useTopFivePopularChannels({ period });

	const pie = useMemo(
		() => messageOriginsData?.origins?.reduce<{ [roomType: string]: number }>((obj, { messages, t }) => ({ ...obj, [t]: messages }), {}),
		[messageOriginsData],
	);

	const table = useMemo(
		() =>
			topFivePopularChannelsData?.channels?.reduce<
				{
					i: number;
					t: string;
					name?: string;
					messages: number;
				}[]
			>((entries, { t, messages, name, usernames }, i) => [...entries, { i, t, name: name || usernames?.join(' × '), messages }], []),
		[topFivePopularChannelsData],
	);

	return (
		<>
			<EngagementDashboardCardFilter>
				<PeriodSelector {...periodSelectorProps} />
				<DownloadDataButton
					attachmentName={`MessagesPerChannelSection_start_${messageOriginsData?.start}_end_${messageOriginsData?.end}`}
					headers={['Room Type', 'Messages']}
					dataAvailable={!!messageOriginsData}
					dataExtractor={(): unknown[][] | undefined => messageOriginsData?.origins.map(({ t, messages }) => [t, messages])}
				/>
			</EngagementDashboardCardFilter>

			<Flex.Container>
				<Margins inline='neg-x12'>
					<Box>
						<Margins inline={12}>
							<Flex.Item grow={1} shrink={0} basis='0'>
								<Box>
									<Flex.Container alignItems='center' wrap='no-wrap'>
										{pie ? (
											<Box>
												<Flex.Item grow={1} shrink={1}>
													<Margins inline={24}>
														<Box
															style={{
																position: 'relative',
																height: 300,
															}}
														>
															<Box
																style={{
																	position: 'absolute',
																	width: '100%',
																	height: '100%',
																}}
															>
																<ResponsivePie
																	data={[
																		{
																			id: 'd',
																			label: t('Direct_Messages'),
																			value: pie.d,
																			color: colors.warning,
																		},
																		{
																			id: 'p',
																			label: t('Private_Channels'),
																			value: pie.p,
																			color: colors.success,
																		},
																		{
																			id: 'c',
																			label: t('Public_Channels'),
																			value: pie.c,
																			color: colors.info,
																		},
																	]}
																	innerRadius={0.6}
																	colors={[colors.warning, colors.success, colors.info]}
																	animate={true}
																	motionConfig='stiff'
																	theme={{
																		// TODO: Get it from theme
																		axis: {
																			ticks: {
																				text: {
																					fill: '#9EA2A8',
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
																	}}
																	tooltip={({ datum }) => <Tooltip>{t('Value_messages', { value: datum.value })}</Tooltip>}
																/>
															</Box>
														</Box>
													</Margins>
												</Flex.Item>
												<Flex.Item basis='auto'>
													<Margins block='neg-x4'>
														<Box>
															<Margins block={4}>
																<Box color='hint' fontScale='p1'>
																	<LegendSymbol color={colors.warning} />
																	{t('Private_Chats')}
																</Box>
																<Box color='hint' fontScale='p1'>
																	<LegendSymbol color={colors.success} />
																	{t('Private_Channels')}
																</Box>
																<Box color='hint' fontScale='p1'>
																	<LegendSymbol color={colors.info} />
																	{t('Public_Channels')}
																</Box>
															</Margins>
														</Box>
													</Margins>
												</Flex.Item>
											</Box>
										) : (
											<Skeleton variant='rect' height={300} />
										)}
									</Flex.Container>
								</Box>
							</Flex.Item>
							<Flex.Item grow={1} shrink={0} basis='0'>
								<Box>
									<Margins blockEnd={16}>
										{table ? <Box fontScale='p1'>{t('Most_popular_channels_top_5')}</Box> : <Skeleton width='50%' />}
									</Margins>
									{table && !table.length && (
										<Tile fontScale='p1' color='hint' style={{ textAlign: 'center' }}>
											{t('Not_enough_data')}
										</Tile>
									)}
									{(!table || !!table.length) && (
										<Table>
											<TableHead>
												<TableRow>
													<TableCell>#</TableCell>
													<TableCell>{t('Channel')}</TableCell>
													<TableCell align='end'>{t('Number_of_messages')}</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{table?.map(({ i, t, name, messages }) => (
													<TableRow key={i}>
														<TableCell>{i + 1}.</TableCell>
														<TableCell>
															<Margins inlineEnd={4}>
																{(t === 'd' && <Icon name='at' />) ||
																	(t === 'p' && <Icon name='lock' />) ||
																	(t === 'c' && <Icon name='hashtag' />)}
															</Margins>
															{name}
														</TableCell>
														<TableCell align='end'>{messages}</TableCell>
													</TableRow>
												))}
												{!table &&
													Array.from({ length: 5 }, (_, i) => (
														<TableRow key={i}>
															<TableCell>
																<Skeleton width='100%' />
															</TableCell>
															<TableCell>
																<Skeleton width='100%' />
															</TableCell>
															<TableCell align='end'>
																<Skeleton width='100%' />
															</TableCell>
														</TableRow>
													))}
											</TableBody>
										</Table>
									)}
								</Box>
							</Flex.Item>
						</Margins>
					</Box>
				</Margins>
			</Flex.Container>
		</>
	);
};

export default MessagesPerChannelSection;
