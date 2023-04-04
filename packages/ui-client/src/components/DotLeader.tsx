import { Box } from '@rocket.chat/fuselage';
import type { FC, CSSProperties } from 'react';

type DotLeaderProps = {
	color?: CSSProperties['borderColor'];
	dotSize?: CSSProperties['borderBlockEndWidth'];
};

export const DotLeader: FC<DotLeaderProps> = ({ color = 'neutral-300', dotSize = 'x2' }) => (
	<Box flexGrow={1} h='full' alignSelf='flex-end' borderBlockEndStyle='dotted' borderBlockEndWidth={dotSize} m='x2' borderColor={color} />
);
