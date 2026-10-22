import { Box, Divider, Stack } from '@rocket.chat/fuselage';

import { ChangePassphrase } from './ChangePassphrase';
import { ResetPassphrase } from './ResetPassphrase';

const EndToEnd = () => {
	return (
		<Stack gap={28}>
			<Box display='flex' flexDirection='column' alignItems='flex-start'>
				<ChangePassphrase />
			</Box>
			<Divider />
			<Box display='flex' flexDirection='column' alignItems='flex-start'>
				<ResetPassphrase />
			</Box>
		</Stack>
	);
};

export default EndToEnd;
