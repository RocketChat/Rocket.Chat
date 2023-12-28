import { Box } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';

const Wrapper = ({ children }: { children: ReactNode }): ReactElement => (
	<Box
		is='span'
		display='inline-flex'
		flexDirection='column'
		alignItems='center'
		justifyContent='space-between'
		paddingBlock={4}
		paddingInline={2}
		verticalAlign='middle'
		children={children}
		height='x24'
		width='x24'
	/>
);

export default Wrapper;
