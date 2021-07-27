import { Box, Margins } from '@rocket.chat/fuselage';
import React from 'react';

import { LegendSymbol } from './LegendSymbol';
import { monochromaticColors, polychromaticColors } from './colors';

export default {
	title: 'admin/enterprise/engagement/data/LegendSymbol',
	component: LegendSymbol,
	decorators: [(fn) => <Margins children={fn()} all='x16' />],
};

export const _default = () => <Box>
	<LegendSymbol />
	Legend text
</Box>;

export const withColor = () => <>
	{monochromaticColors.map((color) => <Box key={color}>
		<LegendSymbol color={color} /> {color}
	</Box>)}
	{polychromaticColors.map((color) => <Box key={color}>
		<LegendSymbol color={color} /> {color}
	</Box>)}
</>;
