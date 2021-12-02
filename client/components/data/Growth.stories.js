import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import Growth from './Growth';

export default {
	title: 'components/data/Growth',
	component: Growth,
	decorators: [(fn) => <Box children={fn()} margin='x16' />],
};

export const Positive = () => <Growth>{3}</Growth>;

export const Zero = () => <Growth>{0}</Growth>;

export const Negative = () => <Growth>{-3}</Growth>;

export const WithTextStyle = () =>
	['h2', 's1', 'c1', 'micro'].map((fontScale) => (
		<Box key={fontScale}>
			<Growth fontScale={fontScale}>{3}</Growth>
			<Growth fontScale={fontScale}>{-3}</Growth>
		</Box>
	));
