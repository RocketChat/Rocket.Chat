import { Box } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode, ComponentProps } from 'react';
import React from 'react';

import * as UserStatus from '../../../components/UserStatus';

type AgentInfoDetailsProps = ComponentProps<typeof Box> & {
	name: string;
	status: ReactNode;
	shortName?: string;
};

const AgentInfoDetails = ({ name, shortName, status = <UserStatus.Offline />, ...props }: AgentInfoDetailsProps): ReactElement => (
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
		{shortName && (
			<Box display='flex' mis='x7' mb='x9' justifyContent='center' fontScale='c1'>
				({shortName})
			</Box>
		)}
	</Box>
);

export default AgentInfoDetails;
