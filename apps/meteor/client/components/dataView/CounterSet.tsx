import { Grid } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';

import Counter from './Counter';

type CounterSetProps = {
	counters: {
		count: ReactNode;
		variation?: number;
		description?: ReactNode;
	}[];
};

const CounterSet = ({ counters = [] }: CounterSetProps): ReactElement => (
	<Grid>
		{counters.map(({ count, variation, description }, i) => (
			<Grid.Item key={i}>
				<Counter count={count} variation={variation} description={description} />
			</Grid.Item>
		))}
	</Grid>
);

export default CounterSet;
