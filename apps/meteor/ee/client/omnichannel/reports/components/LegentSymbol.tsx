import { Box } from '@rocket.chat/fuselage';
import React from 'react';

type LegendSymbolProps = {
	color: string;
};

export const LegendSymbol = ({ color }: LegendSymbolProps) => {
	return (
		<Box
			is='span'
			aria-hidden='true'
			style={{
				display: 'inline-block',
				width: 12,
				height: 12,
				borderRadius: '100%',
				backgroundColor: color,
				verticalAlign: 'baseline',
			}}
		/>
	);
};
