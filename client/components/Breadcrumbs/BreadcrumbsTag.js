import { Box } from '@rocket.chat/fuselage';
import React from 'react';

const BreadcrumbsTag = (props) => (
	<Box
		backgroundColor='neutral-400'
		mis='x8'
		display='inline-flex'
		flexDirection='row'
		alignItems='center'
		color='neutral-700'
		fontSize='x12'
		borderRadius='x4'
		p='x4'
		lineHeight='x16'
		fontWeight='600'
		height='x20'
		{...props}
	/>
);

export default BreadcrumbsTag;
