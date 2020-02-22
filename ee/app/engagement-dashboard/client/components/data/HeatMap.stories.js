import { Box, Flex, Margins } from '@rocket.chat/fuselage';
import React from 'react';

import { HeatMap } from './HeatMap';

export default {
	title: 'admin/engagement/data/HeatMap',
	component: HeatMap,
	decorators: [(fn) => <Margins all='x16'>
		<Flex.Container>
			<Box children={fn()} style={{ height: 240 }} />
		</Flex.Container>
	</Margins>],
};

export const _default = () => <HeatMap />;
