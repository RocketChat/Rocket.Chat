import { Box } from '@rocket.chat/fuselage';
import type { MutableRefObject } from 'react';
import React from 'react';

const style = {
	minHeight: '250px',
};
const Chart = ({ canvasRef, ...props }: { canvasRef: MutableRefObject<HTMLCanvasElement | null> }) => (
	<Box padding='x20' height='x300' {...props}>
		<canvas ref={canvasRef} style={style}></canvas>
	</Box>
);

export default Chart;
