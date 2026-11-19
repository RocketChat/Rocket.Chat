import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type LocalSearchIndexNoteHeaderProps = {
	title: ReactNode;
	action: ReactNode;
};

/**
 * The title row of a note about the local search index: the title on the left and one button on the right. Not the title
 * and actions props of the callout: the title takes only text, and narrow callouts put actions on a new row.
 */
const LocalSearchIndexNoteHeader = ({ title, action }: LocalSearchIndexNoteHeaderProps) => (
	<Box display='flex' alignItems='center' justifyContent='space-between'>
		<Box fontScale='p2b'>{title}</Box>
		{/* Room for the focus ring of the button: the callout clips what overflows it. */}
		<Box padding={2}>{action}</Box>
	</Box>
);

export default LocalSearchIndexNoteHeader;
