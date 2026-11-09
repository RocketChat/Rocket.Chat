import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type InviteLinkActionProps = {
	children: ReactNode;
};

/**
 * The button under the invite link's fields, set 8px below them.
 */
const InviteLinkAction = ({ children }: InviteLinkActionProps) => <Box marginBlockStart='x8'>{children}</Box>;

export default InviteLinkAction;
