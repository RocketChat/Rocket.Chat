import { Box, Margins } from '@rocket.chat/fuselage';
import React from 'react';

import { LegendSymbol } from './LegentSymbol';

type LegendItemProps = {
	color: string;
	label: string;
};

export const LegendItem = ({ color, label }: LegendItemProps) => {
	return (
		<Box color='hint' fontScale='p1'>
			<Margins inline={8}>
				<LegendSymbol color={color} />
			</Margins>
			{label}
		</Box>
	);
};
