import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import PositiveGrowthSymbol from './PositiveGrowthSymbol';

export default {
	title: 'components/data/PositiveGrowthSymbol',
	component: PositiveGrowthSymbol,
	decorators: [(fn) => <Box children={fn()} margin='x16' />],
};

export const Default = () => <PositiveGrowthSymbol />;

export const WithColor = () => <PositiveGrowthSymbol />;

WithColor.decorators = [(storyFn) => <Box color='success'>{storyFn()}</Box>];
