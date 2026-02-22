import { Box } from '@rocket.chat/fuselage';

export type DotLeaderProps = {
	color?: string;
	dotSize?: string;
};

const DotLeader = ({ color = 'neutral-300', dotSize = 'x2' }: DotLeaderProps) => (
	<Box flexGrow={1} h='full' alignSelf='flex-end' borderBlockEndStyle='dotted' borderBlockEndWidth={dotSize} m={2} borderColor={color} />
);

export default DotLeader;
