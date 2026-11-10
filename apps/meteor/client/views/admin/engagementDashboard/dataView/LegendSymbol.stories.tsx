import { Box, Margins } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/dist/colors.json';
import type { Meta, StoryFn } from '@storybook/react';

import LegendSymbol from './LegendSymbol';

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
		{[colors.b100, colors.b200, colors.b300, colors.b400, colors.b500, colors.b600, colors.b700, colors.b800, colors.b900].map((color) => (
			<Box key={color}>
				<LegendSymbol color={color} /> {color}
			</Box>
		))}
		{[colors.y500, colors.g500, colors.b500].map((color) => (
			<Box key={color}>
				<LegendSymbol color={color} /> {color}
			</Box>
		))}
	</>
);
