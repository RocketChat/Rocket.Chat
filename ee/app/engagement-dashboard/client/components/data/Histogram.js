import { ResponsiveBar } from '@nivo/bar';
import { Box, Flex } from '@rocket.chat/fuselage';
import React from 'react';

import { polychromaticColors } from './colors';

export function Histogram() {
	return <Flex.Item align='stretch' grow={1} shrink={0}>
		<Box style={{ position: 'relative' }}>
			<Box style={{ position: 'absolute', width: '100%', height: '100%' }}>
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
					colors={[polychromaticColors[2]]}
					enableLabel={false}
					enableGridX
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
						grid: {
							line: {
								stroke: '#CBCED1',
								strokeWidth: 1,
								strokeDasharray: '4 1.5',
							},
						},
					}}
				/>
			</Box>
		</Box>
	</Flex.Item>;
}
