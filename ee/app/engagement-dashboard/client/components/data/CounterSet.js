import { Grid } from '@rocket.chat/fuselage';
import React from 'react';

import { Counter } from './Counter';

export function CounterSet({ counters = [] }) {
	return <Grid>
		{counters.map(({ count, variation, description }, i) => <Grid.Item key={i}>
			<Counter
				count={count}
				variation={variation}
				description={description}
			/>
		</Grid.Item>)}
	</Grid>;
}
