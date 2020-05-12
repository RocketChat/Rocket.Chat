import { Box, Margins } from '@rocket.chat/fuselage';
import React from 'react';

import { NegativeGrowthSymbol } from './NegativeGrowthSymbol';

export default {
	title: 'admin/engagement/data/NegativeGrowthSymbol',
	component: NegativeGrowthSymbol,
	decorators: [(fn) => <Margins children={fn()} all='x16' />],
};

export const _default = () => <NegativeGrowthSymbol />;

export const withColor = () => <Box color='danger'>
	<NegativeGrowthSymbol />
</Box>;
