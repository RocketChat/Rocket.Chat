import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';

import NegativeGrowthSymbol from './NegativeGrowthSymbol';
import PositiveGrowthSymbol from './PositiveGrowthSymbol';

export type GrowthProps = BoxProps & {
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
