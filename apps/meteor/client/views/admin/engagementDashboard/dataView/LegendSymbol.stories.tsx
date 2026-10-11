import { Box, Margins } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import LegendSymbol from './LegendSymbol';
import { monochromaticColors, polychromaticColors } from './colors';

export default {
	component: LegendSymbol,
	decorators: [(fn) => <Margins all='x16'>{fn()}</Margins>],
} satisfies Meta<typeof LegendSymbol>;

export const WithoutColor: StoryFn<typeof LegendSymbol> = () => (
	<Box>
		<LegendSymbol />
		Legend text
	</Box>
);

export const WithColor: StoryFn<typeof LegendSymbol> = () => (
	<>
		{monochromaticColors.map((color) => (
			<Box key={color}>
				<LegendSymbol color={color} /> {color}
			</Box>
		))}
		{polychromaticColors.map((color) => (
			<Box key={color}>
				<LegendSymbol color={color} /> {color}
			</Box>
		))}
	</>
);
