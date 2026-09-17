import { Box, Icon, FramedIcon } from '@rocket.chat/fuselage';

import type { CallHistoryExternalContact } from '../definitions';

export type CallHistoryExternalUserProps = {
	contact: CallHistoryExternalContact;
	showIcon?: boolean;
};

const CallHistoryExternalUser = ({ contact: { number }, showIcon = true }: CallHistoryExternalUserProps) => {
	return (
		<Box display='flex' flexDirection='row' alignItems='center'>
			<Box marginInlineEnd={8}>
				<FramedIcon icon='user' size={28} />
			</Box>
			{showIcon && (
				<Box marginInlineEnd={8}>
					<Icon name='phone' size={20} />
				</Box>
			)}
			<Box>{number}</Box>
		</Box>
	);
};

export default CallHistoryExternalUser;
