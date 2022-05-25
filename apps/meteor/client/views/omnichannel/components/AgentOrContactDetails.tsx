import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement, ReactNode, ComponentProps } from 'react';

import * as UserStatus from '../../../components/UserStatus';

type AgentOrContactDetailsProps = ComponentProps<typeof Box> & {
	name: ReactNode;
	status: ReactNode;
};

const AgentOrContactDetails = ({ name, status = <UserStatus.Offline />, ...props }: AgentOrContactDetailsProps): ReactElement => (
	<Box
		display='flex'
		title={name}
		flexGrow={0}
		flexShrink={1}
		flexBasis={0}
		alignItems='center'
		fontScale='h4'
		color='default'
		withTruncatedText
		{...props}
	>
		{status}{' '}
		<Box mis='x8' flexGrow={1} withTruncatedText>
			{name}
		</Box>
	</Box>
);

export default AgentOrContactDetails;
