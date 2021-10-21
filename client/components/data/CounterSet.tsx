import { Grid } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import Counter, { ICounter } from './Counter';

interface ICounterSet {
	counters: ICounter[];
}
const CounterSet: FC<ICounterSet> = ({ counters = [] }) => (
	<Grid xl={false}>
		{counters.map(({ count, variation, description }, i) => (
			<Grid.Item xl={false} key={i}>
				<Counter count={count} variation={variation} description={description} />
			</Grid.Item>
		))}
	</Grid>
);

export default CounterSet;
