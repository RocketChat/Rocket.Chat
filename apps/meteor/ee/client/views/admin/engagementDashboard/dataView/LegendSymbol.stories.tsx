import { Box, Margins } from '@rocket.chat/fuselage';
import type { Meta, Story } from '@storybook/react';
import type { ReactElement } from 'react';
import React from 'react';

import LegendSymbol from './LegendSymbol';
import { monochromaticColors, polychromaticColors } from './colors';

export default {
	title: 'Enterprise/Admin/Engagement Dashboard/LegendSymbol',
	component: LegendSymbol,
	decorators: [(fn): ReactElement => <Margins children={fn()} all='x16' />],
} as Meta;

export const withoutColor: Story = () => (
	<Box>
		<LegendSymbol />
		Legend text
	</Box>
);

export const withColor: Story = () => (
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
