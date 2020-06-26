import { Box, Margins } from '@rocket.chat/fuselage';
import React from 'react';

import { Growth } from './Growth';

export default {
	title: 'admin/engagement/data/Growth',
	component: Growth,
	decorators: [(fn) => <Margins children={fn()} all='x16' />],
};

export const positive = () => <Growth>{3}</Growth>;

export const zero = () => <Growth>{0}</Growth>;

export const negative = () => <Growth>{-3}</Growth>;

export const withTextStyle = () =>
	['h1', 's1', 'c1', 'micro']
		.map((fontScale) => <Box key={fontScale}>
			<Growth fontScale={fontScale}>{3}</Growth>
			<Growth fontScale={fontScale}>{-3}</Growth>
		</Box>);
