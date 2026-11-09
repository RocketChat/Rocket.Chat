import { Box, Text } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type ContextualbarListSummaryProps = {
	children: ReactNode;
};

/**
 * The line above a contextual bar's list that says how many of its items are shown.
 */
const ContextualbarListSummary = ({ children }: ContextualbarListSummaryProps) => (
	<Box paddingInline='x24' paddingBlockStart='x4' paddingBlockEnd='x8'>
		<Text is='span' color='hint' fontScale='p2'>
			{children}
		</Text>
	</Box>
);

export default ContextualbarListSummary;
