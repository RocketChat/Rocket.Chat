import { Box, Icon, FramedIcon } from '@rocket.chat/fuselage';

type CallHistoryExternalUserProps = {
	number: string;
	showIcon?: boolean;
};

const CallHistoryExternalUser = ({ number, showIcon = true }: CallHistoryExternalUserProps) => {
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
			<Box>{number.startsWith('+') ? number : `+${number}`}</Box>
		</Box>
	);
};

export default CallHistoryExternalUser;
