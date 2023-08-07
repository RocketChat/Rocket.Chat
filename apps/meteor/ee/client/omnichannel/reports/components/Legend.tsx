import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import { LegendItem } from './LegendItem';

type LegendProps = {
	data: {
		id: string;
		label: string;
		color: string;
	}[];
	direction?: 'row' | 'column';
};

export const Legend = ({ data, direction = 'column' }: LegendProps) => {
	return (
		<Box display='flex' flexDirection={direction} style={{ gap: 8 }}>
			{data.map(({ id, label, color }) => (
				<LegendItem key={id} label={label} color={color} />
			))}
		</Box>
	);
};
