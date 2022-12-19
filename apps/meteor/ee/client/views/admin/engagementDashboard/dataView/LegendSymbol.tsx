import { Box, Margins } from '@rocket.chat/fuselage';
import type { CSSProperties, ReactElement } from 'react';
import React from 'react';

type LegendSymbolProps = {
	color?: CSSProperties['backgroundColor'];
};

const LegendSymbol = ({ color = 'currentColor' }: LegendSymbolProps): ReactElement => (
	<Margins inlineEnd='x8'>
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
	</Margins>
);

export default LegendSymbol;
