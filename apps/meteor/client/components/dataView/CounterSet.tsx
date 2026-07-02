import { Grid, GridItem } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import Counter from './Counter';

type CounterSetProps = {
	counters: {
		count: ReactNode;
		variation?: number;
		description?: ReactNode;
	}[];
};

const CounterSet = ({ counters = [] }: CounterSetProps) => (
	<Grid>
		{counters.map(({ count, variation, description }, i) => (
			<GridItem key={i}>
				<Counter count={count} variation={variation} description={description} />
			</GridItem>
		))}
	</Grid>
);

export default CounterSet;
