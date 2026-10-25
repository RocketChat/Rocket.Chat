import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import ComposerOmnichannelCallout from './ComposerOmnichannelCallout';

// Keeps the footer's own siblings in block flow, out of the gap.
export const ComposerOmnichannelLayout = ({ children }: { children: ReactNode }) => (
	<Box display='flex' flexDirection='column' gap={16}>
		<ComposerOmnichannelCallout />
		<Box>{children}</Box>
	</Box>
);
