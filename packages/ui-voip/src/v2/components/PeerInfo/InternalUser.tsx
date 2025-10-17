import { Avatar, Box, Icon } from '@rocket.chat/fuselage';

type InternalUserProps = {
	displayName: string;
	avatarUrl?: string;
	callerId?: string | number;
};

const InternalUser = ({ displayName, avatarUrl, callerId }: InternalUserProps) => {
	return (
		<Box display='flex' flexDirection='row' id='rcx-media-call-widget-caller-info'>
			<Box mie={8}>{avatarUrl ? <Avatar url={avatarUrl} size='x20' /> : <Icon name='user' size='x20' />}</Box>
			<Box display='flex' flexDirection='column'>
				<Box display='flex' flexDirection='column' fontScale='p2b' color='default'>
					{displayName}
				</Box>
				{callerId && (
					<Box fontScale='c1' color='secondary-info'>
						{callerId}
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default InternalUser;
