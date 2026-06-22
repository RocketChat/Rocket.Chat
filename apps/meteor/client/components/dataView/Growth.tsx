import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

import NegativeGrowthSymbol from './NegativeGrowthSymbol';
import PositiveGrowthSymbol from './PositiveGrowthSymbol';

type GrowthProps = ComponentProps<typeof Box> & {
	children: number;
};

const Growth = ({ children, ...props }: GrowthProps) => {
	if (children === 0) {
		return null;
	}

	return (
		<Box is='span' color={children < 0 ? 'status-font-on-danger' : 'status-font-on-success'} {...props}>
			{children < 0 ? <NegativeGrowthSymbol /> : <PositiveGrowthSymbol />}
			{String(Math.abs(children))}
		</Box>
	);
};

export default Growth;
