import { Box, Flex, Margins } from '@rocket.chat/fuselage';
import React from 'react';

import { CountGraph } from './CountGraph';

export default {
	title: 'admin/engagement/data/CountGraph',
	component: CountGraph,
	decorators: [(fn) => <Margins all='x16'>
		<Flex.Container>
			<Box children={fn()} style={{ height: 240 }} />
		</Flex.Container>
	</Margins>],
};

export const _default = () => <CountGraph data={[['a', 1], ['b', 2], ['c', 3]]} />;
