import React, { forwardRef } from 'react';
import { Box } from '@rocket.chat/fuselage';

const style = {
	minHeight: '250px',
};
const Chart = forwardRef(function Chart(props, ref) {
	return <Box
		padding='x20'
		height='x300'
		{...props}
	>
		<canvas ref={ref} style={style}></canvas>
	</Box>;
});

export default Chart;
