import { Box, Text } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type PasskeyNameProps = {
	icon: ReactNode;
	name: string;
	tags?: ReactNode;
};

/** A passkey's name on one line, cut short when it does not fit, ahead of tags that always show in full. */
const PasskeyName = ({ icon, name, tags }: PasskeyNameProps) => (
	<Box display='flex' alignItems='center' minWidth={0}>
		<Box display='flex' flexShrink={0} marginInlineEnd='x8'>
			{icon}
		</Box>
		<Box flexShrink={1} minWidth={0}>
			<Text fontScale='p2m' color='default' truncate>
				{name}
			</Text>
		</Box>
		{tags && (
			<Box display='flex' flexShrink={0} marginInlineStart='x8'>
				{tags}
			</Box>
		)}
	</Box>
);

export default PasskeyName;
