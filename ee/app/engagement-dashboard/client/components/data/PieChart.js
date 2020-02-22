import { ResponsivePie } from '@nivo/pie';
import { Box, Flex, Margins } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { LegendSymbol } from './LegendSymbol';
import { polychromaticColors } from './colors';

export function PieChart({ data }) {
	const colors = useMemo(
		() => Object.keys(data)
			.map((_, i, { length }) => polychromaticColors[Math.round(polychromaticColors.length / length * i)]),
		[data],
	);

	return <Flex.Item align='stretch' grow={1} shrink={0}>
		<Box style={{ position: 'relative' }}>
			<Box style={{ position: 'absolute', width: '100%', height: '100%' }}>
				<Flex.Container alignItems='center' wrap='no-wrap'>
					<Box>
						<Flex.Item grow={1} shrink={1}>
							<Margins inline='x24'>
								<Box style={{ position: 'relative', height: 300 }}>
									<Box style={{ position: 'absolute', width: '100%', height: '100%' }}>
										<ResponsivePie
											data={Object.entries(data).map(([name, value], i) => ({
												id: name,
												label: name,
												value,
												color: colors[i],
											}))}
											innerRadius={0.6}
											colors={colors}
											enableRadialLabels={false}
											enableSlicesLabels={false}
											animate={true}
											motionStiffness={90}
											motionDamping={15}
											theme={{
												font: 'inherit',
												fontStyle: 'normal',
												fontWeight: 600,
												fontSize: 14,
												lineHeight: 20,
												color: '#9EA2A8',
											}}
										/>
									</Box>
								</Box>
							</Margins>
						</Flex.Item>
						<Flex.Item basis='auto'>
							<Margins block='neg-x4'>
								<Box>
									<Margins block='x4'>
										{Object.keys(data).map((name, i) => <Box key={name} textColor='info' textStyle='p1'>
											<LegendSymbol color={colors[i]} />
											{name}
										</Box>)}
									</Margins>
								</Box>
							</Margins>
						</Flex.Item>
					</Box>
				</Flex.Container>
			</Box>
		</Box>
	</Flex.Item>;
}
