import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

/** One more setting block of the end-to-end encryption tab, set apart from the block above it. */
const EndToEndSettingsSection = ({ children }: { children: ReactNode }) => (
	<Box alignSelf='stretch' paddingBlockStart={32}>
		{children}
	</Box>
);

export default EndToEndSettingsSection;
