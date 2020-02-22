import { Box, Flex, Margins } from '@rocket.chat/fuselage';
import React from 'react';

import { PieChart } from './PieChart';

export default {
	title: 'admin/engagement/data/PieChart',
	component: PieChart,
	decorators: [(fn) => <Margins all='x16'>
		<Flex.Container>
			<Box children={fn()} style={{ height: 240 }} />
		</Flex.Container>
	</Margins>],
};

export const _default = () => <PieChart
	data={{
		A: Math.random(),
		B: Math.random(),
		C: Math.random(),
	}}
/>;
