import { ResponsiveBar } from '@nivo/bar';
import { Box, Flex, Margins } from '@rocket.chat/fuselage';
import React, { useLayoutEffect, useRef, useState } from 'react';

export function CountGraph({ data }) {
	const tickTemplateRef = useRef();
	const barTemplateRef = useRef();
	const [ticksStyle, setTicksStyle] = useState({});
	const [barsStyle, setBarsStyle] = useState({});

	useLayoutEffect(() => {
		if (!tickTemplateRef.current || !barTemplateRef.current) {
			return;
		}

		const ticksStyle = window.getComputedStyle(tickTemplateRef.current);
		const barsStyle = window.getComputedStyle(barTemplateRef.current);
		setTicksStyle(ticksStyle);
		setBarsStyle(barsStyle);
	}, []);

	if (!data) {
		return null;
	}

	return <>
		<Margins block='x4'>
			<Box ref={tickTemplateRef} textColor='hint' textStyle='micro' style={{ display: 'none' }} />
		</Margins>
		<Box ref={barTemplateRef} textColor='primary' style={{ display: 'none' }} />
		<Flex.Item align='stretch' grow={1} shrink={0}>
			<Box style={{ position: 'relative' }}>
				<Box style={{ position: 'absolute', width: '100%', height: '100%' }}>
					<ResponsiveBar
						data={data.map(([label, value]) => ({ x: label, y: value }))}
						indexBy='x'
						keys={['y']}
						groupMode='grouped'
						padding={0.25}
						margin={{
							bottom: parseInt(ticksStyle.lineHeight, 10)
								+ parseInt(ticksStyle.marginTop)
								+ parseInt(ticksStyle.marginBottom),
						}}
						colors={[barsStyle.color]}
						enableLabel={false}
						enableGridY={false}
						axisTop={null}
						axisRight={null}
						axisBottom={{
							tickSize: 0,
							tickPadding: parseInt(ticksStyle.marginTop),
							tickRotation: 0,
						}}
						axisLeft={null}
						animate={true}
						motionStiffness={90}
						motionDamping={15}
						theme={{
							axis: {
								ticks: {
									text: {
										fill: ticksStyle.color,
										fontFamily: ticksStyle.fontFamily,
										fontSize: ticksStyle.fontSize,
										fontStyle: ticksStyle.fontStyle,
										fontWeight: ticksStyle.fontWeight,
										letterSpacing: ticksStyle.letterSpacing,
										lineHeight: ticksStyle.lineHeight,
									},
								},
							},
						}}
					/>
				</Box>
			</Box>
		</Flex.Item>
	</>;
}
