import { Box, Field, FieldRow } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type ThreadComposerOptionProps = {
	children: ReactNode;
};

/**
 * A checkbox and its label under the thread's composer, on one line that may shrink to the composer's width.
 */
const ThreadComposerOption = ({ children }: ThreadComposerOptionProps) => (
	<Box paddingBlock='x8'>
		<Field>
			<FieldRow>
				<Box display='flex' alignItems='center' minWidth={0} gap='x8'>
					{children}
				</Box>
			</FieldRow>
		</Field>
	</Box>
);

export default ThreadComposerOption;
