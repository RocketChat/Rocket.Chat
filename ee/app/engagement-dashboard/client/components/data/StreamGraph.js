import { Box, Flex } from '@rocket.chat/fuselage';
import { ResponsiveLine } from '@nivo/line';
import React, { useMemo } from 'react';

import { monochromaticColors } from './colors';

export function StreamGraph({ lastDate, series }) {
	const colors = useMemo(
		() => Object.keys(series)
			.map((_, i, { length }) => monochromaticColors[Math.floor(monochromaticColors.length / (length + 1) * (i + 1))]),
		[series],
	);

	return <Flex.Item align='stretch' grow={1} shrink={0}>
		<Box style={{ position: 'relative' }}>
			<Box style={{ position: 'absolute', width: '100%', height: '100%' }}>
				<ResponsiveLine
					data={Object.entries(series).map(([name, data]) => ({
						id: name,
						data: data.map((value, i, { length }) => ({
							x: new Date(lastDate.getTime() - (length - 1 - i) * 24 * 60 * 60 * 1000),
							y: value,
						})),
					}))}
					xScale={{
						type: 'time',
						format: 'native',
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
					colors={colors}
					axisLeft={{
						tickSize: 0,
						tickPadding: 5,
						tickRotation: 0,
						tickValues: 3,
					}}
					axisBottom={{
						tickSize: 0,
						tickPadding: 5,
						tickRotation: 0,
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
		</Box>
	</Flex.Item>;
}
