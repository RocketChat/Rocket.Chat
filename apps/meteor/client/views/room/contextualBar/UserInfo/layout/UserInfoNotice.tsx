import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type UserInfoNoticeProps = {
	children: ReactNode;
};

/**
 * A notice shown in place of the user's details, clear of the panel's header.
 */
const UserInfoNotice = ({ children }: UserInfoNoticeProps) => <Box paddingBlock='x16'>{children}</Box>;

export default UserInfoNotice;
