import { Box } from '@rocket.chat/fuselage';
import React, { forwardRef } from 'react';

const style = {
	minHeight: '250px',
};
const Chart = forwardRef(function Chart(props, ref) {
	return (
		<Box padding='x20' height='x300' {...props}>
			<canvas ref={ref} style={style}></canvas>
		</Box>
	);
});

export default Chart;
