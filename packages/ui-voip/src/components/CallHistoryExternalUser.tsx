import { Box, Icon, FramedIcon } from '@rocket.chat/fuselage';

import type { CallHistoryExternalContact } from '../definitions';

type CallHistoryExternalUserProps = {
	contact: CallHistoryExternalContact;
	showIcon?: boolean;
};

const CallHistoryExternalUser = ({ contact: { number, name }, showIcon = true }: CallHistoryExternalUserProps) => {
	return (
		<Box display='flex' flexDirection='row' alignItems='center'>
			<Box mie={8}>
				<FramedIcon icon='user' size={28} />
			</Box>
			{showIcon && (
				<Box mie={8}>
					<Icon name='phone' size={20} />
				</Box>
			)}
			{number && name && (
				<Box>
					{name} - {number}
				</Box>
			)}
			{(!number || !name) && <Box>{name || number}</Box>}
		</Box>
	);
};

export default CallHistoryExternalUser;
