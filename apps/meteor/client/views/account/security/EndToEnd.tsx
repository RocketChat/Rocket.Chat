import { Box, Divider } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

import { ChangePassphrase } from './ChangePassphrase';
import { ResetPassphrase } from './ResetPassphrase';

const EndToEnd = (props: ComponentPropsWithoutRef<typeof Box>): JSX.Element => {
	return (
		<Box display='flex' flexDirection='column' alignItems='flex-start' {...props}>
			<ChangePassphrase />
			<Divider mb={36} width='full' />
			<ResetPassphrase />
		</Box>
	);
};

export default EndToEnd;
