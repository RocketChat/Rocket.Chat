import { Box, Margins } from '@rocket.chat/fuselage';
import React from 'react';

export function LegendSymbol({ color = 'currentColor' }) {
	return <Margins inlineEnd='x8'>
		<Box
			is='span'
			aria-hidden='true'
			style={{
				display: 'inline-block',
				width: 12,
				height: 12,
				borderRadius: 2,
				backgroundColor: color,
				verticalAlign: 'baseline',
			}}
		/>
	</Margins>;
}
