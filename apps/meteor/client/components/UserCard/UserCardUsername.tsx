import { Box } from '@rocket.chat/fuselage';
import type { ReactNode, ComponentProps } from 'react';

import * as UserStatus from '../UserStatus';

type UserCardUsernameProps = ComponentProps<typeof Box> & {
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
		<Box mis={8} flexGrow={1} withTruncatedText>
			{name}
		</Box>
	</Box>
);

export default UserCardUsername;
