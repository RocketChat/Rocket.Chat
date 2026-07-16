import { Box } from '@rocket.chat/fuselage';
import type { ReactNode, ComponentProps } from 'react';

import * as UserStatus from '../../../components/UserStatus';

export type AgentInfoDetailsProps = ComponentProps<typeof Box> & {
	name: string | undefined;
	status: ReactNode;
	shortName?: string;
};

const AgentInfoDetails = ({ name, shortName, status = <UserStatus.Offline />, ...props }: AgentInfoDetailsProps) => (
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
		<Box marginInlineStart={8} flexGrow={1} withTruncatedText>
			{name}
		</Box>
		{shortName && (
			<Box display='flex' marginInlineStart={8} marginBlock={8} justifyContent='center' fontScale='c1'>
				({shortName})
			</Box>
		)}
	</Box>
);

export default AgentInfoDetails;
