import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const Wrapper: FC = ({ children }) => (
	<Box
		is='span'
		display='inline-flex'
		flexDirection='column'
		alignItems='center'
		justifyContent='space-between'
		sizes='x24'
		paddingBlock='x4'
		paddingInline='x2'
		verticalAlign='middle'
		children={children}
	/>
);

export default Wrapper;
