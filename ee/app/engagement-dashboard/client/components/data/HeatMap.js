import { ResponsiveHeatMap } from '@nivo/heatmap';
import { Box, Flex } from '@rocket.chat/fuselage';
import React from 'react';

import { monochromaticColors } from './colors';

export function HeatMap({ keys, indexBy, values }) {
	return <Flex.Item align='stretch' grow={1} shrink={0}>
		<Box style={{ position: 'relative' }}>
			<Box style={{ position: 'absolute', width: '100%', height: '100%' }}>
				<ResponsiveHeatMap
					data={values}
					indexBy={indexBy}
					keys={keys}
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
