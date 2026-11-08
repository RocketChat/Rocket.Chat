import { Box, Divider } from '@rocket.chat/fuselage';

import { ChangePassphrase } from './ChangePassphrase';
import { ResetPassphrase } from './ResetPassphrase';

const EndToEnd = () => {
	return (
		<Box display='flex' flexDirection='column' alignItems='flex-start'>
			<ChangePassphrase />
			<Box alignSelf='stretch' paddingBlock='x32'>
				<Divider flush />
			</Box>
			<ResetPassphrase />
		</Box>
	);
};

export default EndToEnd;
