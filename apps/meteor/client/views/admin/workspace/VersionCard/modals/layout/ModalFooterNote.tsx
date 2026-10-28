import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type ModalFooterNoteProps = {
	children: ReactNode;
};

/**
 * A short note in small print at the start of a modal footer, its links set in line with the text.
 */
const ModalFooterNote = ({ children }: ModalFooterNoteProps) => (
	<Box display='flex' justifyContent='start' fontSize='c1' width='full'>
		{children}
	</Box>
);

export default ModalFooterNote;
