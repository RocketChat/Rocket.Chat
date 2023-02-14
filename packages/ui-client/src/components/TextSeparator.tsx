import { Box } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';

import { DotLeader } from './DotLeader';

type TextSeparatorProps = {
	label: ReactNode;
	value: ReactNode;
};

const TextSeparator = ({ label, value }: TextSeparatorProps): ReactElement => (
	<Box display='flex' flexDirection='row' mb='x4'>
		<Box display='inline-flex' alignItems='center'>
			{label}
		</Box>
		<DotLeader />
		<span>{value}</span>
	</Box>
);

export default TextSeparator;
