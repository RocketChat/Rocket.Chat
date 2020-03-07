import { ResponsiveBar } from '@nivo/bar';
import { Box, Flex } from '@rocket.chat/fuselage';
import React from 'react';

export function CountGraph({ data }) {
	if (!data) {
		return null;
	}

	return <Flex.Item align='stretch' grow={1} shrink={0}>
		<Box style={{ position: 'relative' }}>
			<Box style={{ position: 'absolute', width: '100%', height: '100%' }}>
				<ResponsiveBar
					data={data.map(([label, value]) => ({ x: label, y: value }))}
					indexBy='x'
					keys={['y']}
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
	</Flex.Item>;
}
