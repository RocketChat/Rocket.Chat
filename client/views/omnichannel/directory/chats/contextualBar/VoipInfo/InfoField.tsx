import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

type InfoFieldPropsType = {
	label: string;
	info: string | number;
};

export const InfoField = ({ label, info }: InfoFieldPropsType): ReactElement => (
	<Box fontScale='p2' mb='14px'>
		<Box mbe='8px'>{label}</Box>
		<Box color='info'>{info}</Box>
	</Box>
);
