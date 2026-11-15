import { Box } from '@rocket.chat/fuselage';
import type { BorderWidth } from '@rocket.chat/fuselage';
import type { CSSProperties } from 'react';

export type DotLeaderProps = {
	color?: CSSProperties['borderColor'];
	dotSize?: BorderWidth;
};

const DotLeader = ({ color = 'neutral-300', dotSize = 'medium' }: DotLeaderProps) => (
	<Box
		flexGrow={1}
		height='full'
		alignSelf='flex-end'
		borderBlockEndStyle='dotted'
		borderBlockEndWidth={dotSize}
		margin={2}
		borderColor={color}
	/>
);

export default DotLeader;
