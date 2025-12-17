import { Box, Icon, FramedIcon } from '@rocket.chat/fuselage';

type CallHistoryExternalUserProps = {
	number: string;
};

const CallHistoryExternalUser = ({ number }: CallHistoryExternalUserProps) => {
	return (
		<Box display='flex' flexDirection='row' alignItems='center'>
			<Box mie={8}>
				<FramedIcon icon='user' size={28} />
			</Box>
			<Box mie={8}>
				<Icon name='phone' size={20} />
			</Box>
			<Box>{number.startsWith('+') ? number : `+${number}`}</Box>
		</Box>
	);
};

export default CallHistoryExternalUser;
