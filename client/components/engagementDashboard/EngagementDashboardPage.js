import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { ResponsiveLine } from '@nivo/line';
import { Box, Divider, Flex, Grid, InputBox, Margins, Tabs } from '@rocket.chat/fuselage';
import React, { useEffect, useState } from 'react';

import { Header } from '../header/Header';
import { IncreasingArrowIndicator } from './IncreasingArrowIndicator';
import { DecreasingArrowIndicator } from './DecreasingArrowIndicator';

function BigNumber({ children }) {
	return <Box is='span' textColor='default' textStyle='h1' style={{ fontSize: 40, lineHeight: 1 }}>
		{children}
	</Box>;
}

export function EngagementDashboardPage() {
	const [, setRnd] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => setRnd((i) => i + 1), 1000);
		return () => clearInterval(timer);
	}, []);

	return <Box>
		<Header rawSectionName='Engagement Dashboard' />
		<Margins all='24'>
			<Box>
				<Tabs>
					<Tabs.Item active>Users</Tabs.Item>
					<Tabs.Item>Messages</Tabs.Item>
					<Tabs.Item>Channels</Tabs.Item>
				</Tabs>
				<Margins block='16'>
					<Grid>
						<Flex.Container alignItems='center'>
							<Grid.Item sm='10'>
								<Box textStyle='s2' textColor='default'>New users</Box>
							</Grid.Item>
						</Flex.Container>
						<Grid.Item sm='2'>
							<Flex.Container>
								<InputBox.Skeleton />
							</Flex.Container>
						</Grid.Item>
					</Grid>
					<Grid>
						<Grid.Item>
							<Flex.Container alignItems='flex-end'>
								<Box>
									<BigNumber>{Math.round(120 * Math.random())}</BigNumber> <IncreasingArrowIndicator size={24} />
								</Box>
							</Flex.Container>
							<Margins block='12'>
								<Box textStyle='p1' textColor='hint'>Last 7 days</Box>
							</Margins>
						</Grid.Item>
						<Grid.Item>
							<Flex.Container alignItems='flex-end'>
								<Box>
									<BigNumber>{Math.round(23 * Math.random())}</BigNumber> <DecreasingArrowIndicator size={24} />
								</Box>
							</Flex.Container>
							<Margins block='12'>
								<Box textStyle='p1' textColor='hint'>Yesterday</Box>
							</Margins>
						</Grid.Item>
						<Grid.Item />
					</Grid>
					<Box style={{ height: 240 }}>
						<ResponsiveBar
							data={[
								{
									dayOfWeek: 'Monday',
									newUsers: Math.round(168 * Math.random()),

								},
								{
									dayOfWeek: 'Tuesday',
									newUsers: Math.round(88 * Math.random()),
								},
								{
									dayOfWeek: 'Wednesday',
									newUsers: Math.round(131 * Math.random()),
								},
								{
									dayOfWeek: 'Thurday',
									newUsers: Math.round(145 * Math.random()),
								},
								{
									dayOfWeek: 'Friday',
									newUsers: Math.round(26 * Math.random()),
								},
								{
									dayOfWeek: 'Saturday',
									newUsers: Math.round(60 * Math.random()),
								},
								{
									dayOfWeek: 'Sunday',
									newUsers: Math.round(50 * Math.random()),
								},
							]}
							indexBy='dayOfWeek'
							keys={['newUsers']}
							groupMode='grouped'
							padding={0.25}
							margin={{ bottom: 20 }}
							colors={['#1D74F5']}
							enableLabel={false}
							enableGridY={false}
							axisTop={null}
							axisRight={null}
							axisBottom={{
								tickSize: 0,
								tickPadding: 5,
								tickRotation: 0,
							}}
							axisLeft={null}
							animate={true}
							motionStiffness={90}
							motionDamping={15}
							theme={{
								font: 'inherit',
								fontStyle: 'normal',
								fontWeight: 600,
								fontSize: 10,
								lineHeight: 12,
								letterSpacing: 0.2,
								color: '#9EA2A8',
							}}
						/>
					</Box>
				</Margins>
				<Divider />
				<Margins block='16'>
					<Grid>
						<Flex.Container alignItems='center'>
							<Grid.Item>
								<Box textStyle='s2' textColor='default'>Active users</Box>
							</Grid.Item>
						</Flex.Container>
					</Grid>
					<Grid>
						<Grid.Item>
							<Flex.Container alignItems='flex-end'>
								<Box>
									<BigNumber>{Math.round(280 * Math.random())}</BigNumber> <IncreasingArrowIndicator size={24} />
								</Box>
							</Flex.Container>
							<Margins block='12'>
								<Box textStyle='p1' textColor='hint'>
									<Margins inline='8'>
										<Box is='span' style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#D1EBFE' }} />
									</Margins>
									Daily Active Users
								</Box>
							</Margins>
						</Grid.Item>
						<Grid.Item>
							<Flex.Container alignItems='flex-end'>
								<Box>
									<BigNumber>{Math.round(300 * Math.random())}</BigNumber> <IncreasingArrowIndicator size={24} />
								</Box>
							</Flex.Container>
							<Margins block='12'>
								<Box textStyle='p1' textColor='hint'>
									<Margins inline='8'>
										<Box is='span' style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#76B7FC' }} />
									</Margins>
									Weekly Active Users
								</Box>
							</Margins>
						</Grid.Item>
						<Grid.Item>
							<Flex.Container alignItems='flex-end'>
								<Box>
									<BigNumber>{Math.round(310 * Math.random())}</BigNumber> <DecreasingArrowIndicator size={24} />
								</Box>
							</Flex.Container>
							<Margins block='12'>
								<Box textStyle='p1' textColor='hint'>
									<Margins inline='8'>
										<Box is='span' style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#1D74F5' }} />
									</Margins>
									Monthly Active Users
								</Box>
							</Margins>
						</Grid.Item>
						<Grid.Item />
					</Grid>
					<Box style={{ height: 240 }}>
						<ResponsiveLine
							data={[
								{
									id: 'dailyActiveUsers',
									data: Array.from({ length: 21 }, (_, i) => ({
										x: `2020-01-${ String(i).padStart(2, '0') }`,
										y: Math.round(200 + 80 * Math.random()),
									})),
								},
								{
									id: 'weeklyActiveUsers',
									data: Array.from({ length: 21 }, (_, i) => ({
										x: `2020-01-${ String(i).padStart(2, '0') }`,
										y: Math.round(220 + 80 * Math.random()),
									})),
								},
								{
									id: 'monthlyActiveUsers',
									data: Array.from({ length: 21 }, (_, i) => ({
										x: `2020-01-${ String(i).padStart(2, '0') }`,
										y: Math.round(240 + 80 * Math.random()),
									})),
								},
							]}
							xScale={{
								type: 'time',
								format: '%Y-%m-%d',
								precision: 'day',
							}}
							xFormat='time:%Y-%m-%d'
							yScale={{
								type: 'linear',
								stacked: true,
							}}
							enableGridX={false}
							enableGridY={false}
							enablePoints={false}
							useMesh
							enableArea
							areaOpacity={1}
							enableCrosshair
							crosshairType='bottom'
							margin={{ top: 0, bottom: 20, right: 0, left: 32 }}
							colors={['#D1EBFE', '#76B7FC', '#1D74F5']}
							axisLeft={{
								tickSize: 0,
								tickPadding: 5,
								tickRotation: 0,
								tickValues: 3,
							}}
							axisBottom={{
								format: '%Y-%m-%d',
								tickValues: 'every 7 days',
							}}
							animate={true}
							motionStiffness={90}
							motionDamping={15}
							theme={{
								font: 'inherit',
								fontStyle: 'normal',
								fontWeight: 600,
								fontSize: 10,
								lineHeight: 12,
								letterSpacing: 0.2,
								color: '#9EA2A8',
							}}
						/>
					</Box>
				</Margins>
				<Divider />
				<Grid>
					<Grid.Item md='4'>
						<Margins block='16'>
							<Grid>
								<Flex.Container alignItems='center'>
									<Grid.Item sm='9'>
										<Box textStyle='s2' textColor='default'>Users by time of day</Box>
									</Grid.Item>
								</Flex.Container>
								<Grid.Item sm='3'>
									<Flex.Container>
										<InputBox.Skeleton />
									</Flex.Container>
								</Grid.Item>
							</Grid>
							<Box style={{ height: 696 }}>
								<ResponsiveHeatMap
									data={Array.from({ length: 24 }, (_, i) => ({
										hour: i,
										sunday: Math.round(200 * Math.random()),
										monday: Math.round(200 * Math.random()),
										tuesday: Math.round(200 * Math.random()),
										wednesday: Math.round(200 * Math.random()),
										thursday: Math.round(200 * Math.random()),
										friday: Math.round(200 * Math.random()),
										saturday: Math.round(200 * Math.random()),
									}))}
									indexBy='hour'
									keys={['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']}
									groupMode='grouped'
									padding={4}
									margin={{ left: 32, bottom: 20 }}
									colors={['#E8F2FF', '#A4D3FE', '#76B7FC', '#549DF9', '#10529E']}
									cellOpacity={1}
									enableLabels={false}
									axisTop={null}
									axisRight={null}
									axisBottom={{
										tickSize: 0,
										tickPadding: 5,
										tickRotation: 0,
										format: (key) =>
											(key === 'sunday' && 'Sun')
											|| (key === 'monday' && 'Mon')
											|| (key === 'tuesday' && 'Tue')
											|| (key === 'wednesday' && 'Wed')
											|| (key === 'thursday' && 'Thu')
											|| (key === 'friday' && 'Fri')
											|| (key === 'saturday' && 'Sat'),
									}}
									axisLeft={{
										tickSize: 0,
										tickPadding: 5,
										tickRotation: 0,
									}}
									animate={true}
									motionStiffness={90}
									motionDamping={15}
									theme={{
										font: 'inherit',
										fontStyle: 'normal',
										fontWeight: 600,
										fontSize: 10,
										lineHeight: 12,
										letterSpacing: 0.2,
										color: '#9EA2A8',
									}}
								/>
							</Box>
						</Margins>
					</Grid.Item>
					<Grid.Item md='4'>
						<Margins block='16'>
							<Grid>
								<Flex.Container alignItems='center'>
									<Grid.Item sm='9'>
										<Box textStyle='s2' textColor='default'>When is the chat busier?</Box>
									</Grid.Item>
								</Flex.Container>
								<Grid.Item sm='3'>
									<Flex.Container>
										<InputBox.Skeleton />
									</Flex.Container>
								</Grid.Item>
							</Grid>
							<Box style={{ textAlign: 'center' }}>
									&lt; Monday &gt;
							</Box>
							<Box style={{ height: 196 }}>
								<ResponsiveBar
									data={[
										{
											hour: '8',
											users: Math.round(168 * Math.random()),
										},
										{
											hour: '10',
											users: Math.round(88 * Math.random()),
										},
										{
											hour: '12',
											users: Math.round(131 * Math.random()),
										},
										{
											hour: '14',
											users: Math.round(145 * Math.random()),
										},
										{
											hour: '15',
											users: Math.round(26 * Math.random()),
										},
										{
											hour: '16',
											users: Math.round(60 * Math.random()),
										},
										{
											hour: '17',
											users: Math.round(50 * Math.random()),
										},
										{
											hour: '20',
											users: Math.round(50 * Math.random()),
										},
									]}
									indexBy='hour'
									keys={['users']}
									groupMode='grouped'
									padding={0.25}
									margin={{ bottom: 20 }}
									colors={['#1D74F5']}
									enableLabel={false}
									enableGridY={false}
									axisTop={null}
									axisRight={null}
									axisBottom={{
										tickSize: 0,
										tickPadding: 5,
										tickRotation: 0,
									}}
									axisLeft={null}
									animate={true}
									motionStiffness={90}
									motionDamping={15}
									theme={{
										font: 'inherit',
										fontStyle: 'normal',
										fontWeight: 600,
										fontSize: 10,
										lineHeight: 12,
										letterSpacing: 0.2,
										color: '#9EA2A8',
									}}
								/>
							</Box>
						</Margins>
						<Divider />
						<Margins block='16'>
							<Grid>
								<Flex.Container alignItems='center'>
									<Grid.Item sm='9'>
										<Box textStyle='s2' textColor='default'>UTCs most used</Box>
									</Grid.Item>
								</Flex.Container>
								<Grid.Item sm='3'>
									<Flex.Container>
										<InputBox.Skeleton />
									</Flex.Container>
								</Grid.Item>
							</Grid>
							<Box style={{ height: 196 }}>
								<ResponsiveBar
									data={[
										{
											utc: '-3',
											users: Math.round(100 * Math.random()),
										},
										{
											utc: '-5',
											users: Math.round(100 * Math.random()),
										},
										{
											utc: '+2',
											users: Math.round(100 * Math.random()),
										},
										{
											utc: '+8',
											users: Math.round(100 * Math.random()),
										},
										{
											utc: '-6',
											users: Math.round(100 * Math.random()),
										},
										{
											utc: '16',
											users: Math.round(100 * Math.random()),
										},
									]}
									indexBy='utc'
									keys={['users']}
									groupMode='grouped'
									layout='horizontal'
									padding={0.25}
									margin={{ left: 64, bottom: 20 }}
									colors={['#1D74F5']}
									enableLabel={false}
									enableGridY={false}
									axisTop={null}
									axisRight={null}
									axisBottom={{
										tickSize: 0,
										tickPadding: 5,
										tickRotation: 0,
										format: (users) => `${ users }%`,
									}}
									axisLeft={{
										tickSize: 0,
										tickPadding: 5,
										tickRotation: 0,
										format: (utc) => `UTF ${ utc }`,
									}}
									animate={true}
									motionStiffness={90}
									motionDamping={15}
									theme={{
										font: 'inherit',
										fontStyle: 'normal',
										fontWeight: 600,
										fontSize: 10,
										lineHeight: 12,
										letterSpacing: 0.2,
										color: '#9EA2A8',
									}}
								/>
							</Box>
						</Margins>
					</Grid.Item>
				</Grid>
			</Box>
		</Margins>
	</Box>;
}
