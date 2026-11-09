import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type InviteLinkCaptionProps = {
	children: ReactNode;
};

/**
 * The note under the invite link that says when it expires and how many uses it has left.
 */
const InviteLinkCaption = ({ children }: InviteLinkCaptionProps) => (
	<Box paddingBlock='x8' color='annotation' fontScale='c2'>
		{children}
	</Box>
);

export default InviteLinkCaption;
