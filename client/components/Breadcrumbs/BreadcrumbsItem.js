import { Box } from '@rocket.chat/fuselage';
import React from 'react';

const BreadcrumbsItem = (props) => (
	<Box
		mi='neg-x2'
		display='inline-flex'
		flexDirection='row'
		alignItems='center'
		color='info'
		fontScale='s2'
		{...props}
	/>
);

export default BreadcrumbsItem;
