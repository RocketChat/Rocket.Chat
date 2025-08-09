import { Avatar, Box } from '@rocket.chat/fuselage';

type InternalUserProps = {
	name: string;
	avatarUrl: string;
	identifier: string | number;
};

const InternalUser = ({ name, avatarUrl, identifier }: InternalUserProps) => {
	return (
		<Box display='flex' flexDirection='row'>
			<Box mie={8}>
				<Avatar url={avatarUrl} size='x20' />
			</Box>
			<Box display='flex' flexDirection='column'>
				<Box display='flex' flexDirection='column' fontScale='p2b'>
					{name}
				</Box>
				<Box fontScale='c1' color='secondary-info'>
					{identifier}
				</Box>
			</Box>
		</Box>
	);
};

export default InternalUser;
