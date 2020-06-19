import { ResponsivePie } from '@nivo/pie';
import { Box, Flex, Icon, Margins, Select, Skeleton, Table, Tile } from '@rocket.chat/fuselage';
import moment from 'moment';
import React, { useMemo, useState } from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { useEndpointData } from '../../../../../../client/hooks/useEndpointData';
import { LegendSymbol } from '../data/LegendSymbol';
import { Section } from '../Section';
import { ActionButton } from '../../../../../../client/components/basic/Buttons/ActionButton';
import { saveFile } from '../../../../../../client/lib/saveFile';

const convertDataToCSV = (data) => `// type, messagesSent
${ data.map(({ t, messages }) => `${ t }, ${ messages }`).join('\n') }`;

export function MessagesPerChannelSection() {
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

	const pieData = useEndpointData('engagement-dashboard/messages/origin', params);
	const tableData = useEndpointData('engagement-dashboard/messages/top-five-popular-channels', params);

	const [pie, table] = useMemo(() => {
		if (!pieData || !tableData) {
			return [];
		}

		const pie = pieData.origins.reduce((obj, { messages, t }) => ({ ...obj, [t]: messages }), {});

		const table = tableData.channels.reduce((entries, { t, messages, name, usernames }, i) =>
			[...entries, { i, t, name: name || usernames.join(' × '), messages }], []);

		return [pie, table];
	}, [period, pieData, tableData]);

	const downloadData = () => {
		saveFile(convertDataToCSV(pieData.origins), `MessagesPerChannelSection_start_${ params.start }_end_${ params.end }.csv`);
	};


	return <Section
		title={t('Where_are_the_messages_being_sent?')}
		filter={<><Select options={periodOptions} value={periodId} onChange={handlePeriodChange} /><ActionButton mis='x16' disabled={!pieData} onClick={downloadData} aria-label={t('Download_Info')} icon='download'/></>}
	>
		<Flex.Container>
			<Margins inline='neg-x12'>
				<Box>
					<Margins inline='x12'>
						<Flex.Item grow={1} shrink={0} basis='0'>
							<Box>
								<Flex.Container alignItems='center' wrap='no-wrap'>
									{pie
										? <Box>
											<Flex.Item grow={1} shrink={1}>
												<Margins inline='x24'>
													<Box style={{ position: 'relative', height: 300 }}>
														<Box style={{ position: 'absolute', width: '100%', height: '100%' }}>
															<ResponsivePie
																data={[
																	{
																		id: 'd',
																		label: t('Private_Chats'),
																		value: pie.d,
																		color: '#FFD031',
																	},
																	{
																		id: 'c',
																		label: t('Private_Channels'),
																		value: pie.c,
																		color: '#2DE0A5',
																	},
																	{
																		id: 'p',
																		label: t('Public_Channels'),
																		value: pie.p,
																		color: '#1D74F5',
																	},
																]}
																innerRadius={0.6}
																colors={['#FFD031', '#2DE0A5', '#1D74F5']}
																enableRadialLabels={false}
																enableSlicesLabels={false}
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
																				fontSize: 10,
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
												</Margins>
											</Flex.Item>
											<Flex.Item basis='auto'>
												<Margins block='neg-x4'>
													<Box>
														<Margins block='x4'>
															<Box color='info' fontScale='p1'>
																<LegendSymbol color='#FFD031' />
																{t('Private_Chats')}
															</Box>
															<Box color='info' fontScale='p1'>
																<LegendSymbol color='#2DE0A5' />
																{t('Private_Channels')}
															</Box>
															<Box color='info' fontScale='p1'>
																<LegendSymbol color='#1D74F5' />
																{t('Public_Channels')}
															</Box>
														</Margins>
													</Box>
												</Margins>
											</Flex.Item>
										</Box>
										: <Skeleton variant='rect' height={300} />}
								</Flex.Container>
							</Box>
						</Flex.Item>
						<Flex.Item grow={1} shrink={0} basis='0'>
							<Box>
								<Margins blockEnd='x16'>
									{table ? <Box fontScale='p1'>{t('Most_popular_channels_top_5')}</Box> : <Skeleton width='50%' />}
								</Margins>
								{table && !table.length && <Tile fontScale='p1' color='info' style={{ textAlign: 'center' }}>
									{t('Not_enough_data')}
								</Tile>}
								{(!table || !!table.length) && <Table>
									<Table.Head>
										<Table.Row>
											<Table.Cell>{'#'}</Table.Cell>
											<Table.Cell>{t('Channel')}</Table.Cell>
											<Table.Cell align='end'>{t('Number_of_messages')}</Table.Cell>
										</Table.Row>
									</Table.Head>
									<Table.Body>
										{table && table.map(({ i, t, name, messages }) => <Table.Row key={i}>
											<Table.Cell>{i + 1}.</Table.Cell>
											<Table.Cell>
												<Margins inlineEnd='x4'>
													{(t === 'd' && <Icon name='at' />)
													|| (t === 'c' && <Icon name='lock' />)
													|| (t === 'p' && <Icon name='hashtag' />)}
												</Margins>
												{name}
											</Table.Cell>
											<Table.Cell align='end'>{messages}</Table.Cell>
										</Table.Row>)}
										{!table && Array.from({ length: 5 }, (_, i) => <Table.Row key={i}>
											<Table.Cell>
												<Skeleton width='100%' />
											</Table.Cell>
											<Table.Cell>
												<Skeleton width='100%' />
											</Table.Cell>
											<Table.Cell align='end'>
												<Skeleton width='100%' />
											</Table.Cell>
										</Table.Row>)}
									</Table.Body>
								</Table>}
							</Box>
						</Flex.Item>
					</Margins>
				</Box>
			</Margins>
		</Flex.Container>
	</Section>;
}
