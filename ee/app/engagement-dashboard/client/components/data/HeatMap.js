import { ResponsiveHeatMap } from '@nivo/heatmap';
import { Box, Flex } from '@rocket.chat/fuselage';
import React from 'react';

import { monochromaticColors } from './colors';

export function HeatMap() {
	return <Flex.Item align='stretch' grow={1} shrink={0}>
		<Box style={{ position: 'relative' }}>
			<Box style={{ position: 'absolute', width: '100%', height: '100%' }}>
				<ResponsiveHeatMap
					data={Array.from({ length: 24 }, (_, i) => ({
						hour: String(i),
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
					colors={monochromaticColors}
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
		</Box>
	</Flex.Item>;
}
