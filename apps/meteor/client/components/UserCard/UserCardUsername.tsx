import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import * as UserStatus from '../UserStatus';

export type UserCardUsernameProps = BoxProps & {
	name: ReactNode;
	status: ReactNode;
};

const UserCardUsername = ({ name, status = <UserStatus.Offline />, ...props }: UserCardUsernameProps) => (
	<Box
		display='flex'
		title={name}
		flexGrow={2}
		flexShrink={1}
		flexBasis={0}
		alignItems='center'
		fontScale='h4'
		color='default'
		withTruncatedText
		{...props}
	>
		{status}
		<Box marginInlineStart={8} flexGrow={1} withTruncatedText>
			{name}
		</Box>
	</Box>
);

export default UserCardUsername;
