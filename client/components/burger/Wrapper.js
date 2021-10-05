import { Box } from '@rocket.chat/fuselage';
import React from 'react';

const Wrapper = ({ children }) => (
	<Box
		is='span'
		display='inline-flex'
		flexDirection='column'
		alignItems='center'
		justifyContent='space-between'
		size='x24'
		paddingBlock='x4'
		paddingInline='x2'
		verticalAlign='middle'
		children={children}
	/>
);

export default Wrapper;
