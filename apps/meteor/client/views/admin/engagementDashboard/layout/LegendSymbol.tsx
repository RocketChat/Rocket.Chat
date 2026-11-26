import { Box, Margins } from '@rocket.chat/fuselage';
import type { CSSProperties } from 'react';

export type LegendSymbolProps = {
	color?: CSSProperties['backgroundColor'];
};

/**
 * The coloured square that marks a series in a chart legend.
 */
const LegendSymbol = ({ color = 'currentColor' }: LegendSymbolProps) => (
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
