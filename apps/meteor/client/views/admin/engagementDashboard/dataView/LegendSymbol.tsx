import { Box } from '@rocket.chat/fuselage';
import type { CSSProperties } from 'react';

export type LegendSymbolProps = {
	color?: CSSProperties['backgroundColor'];
};

const LegendSymbol = ({ color = 'currentColor' }: LegendSymbolProps) => (
	<Box
		is='span'
		marginInlineEnd={8}
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
);

export default LegendSymbol;
