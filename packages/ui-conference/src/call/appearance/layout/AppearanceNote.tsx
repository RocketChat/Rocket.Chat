import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppearanceNoteProps = { children: ReactNode };

const AppearanceNote = ({ children }: AppearanceNoteProps) => (
	<Box fontScale='c1' color='hint' marginBlockStart='x8'>
		{children}
	</Box>
);

export default AppearanceNote;
