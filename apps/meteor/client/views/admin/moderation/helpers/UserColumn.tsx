import { Box } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { ComponentProps } from 'react';

type UserColumnProps = {
	name?: string;
	username?: string;
	isDesktopOrLarger?: boolean;
	isProfile?: boolean;
	size: ComponentProps<typeof UserAvatar>['size'];
	fontSize?: string;
};

const UserColumn = ({ name, username, fontSize, size }: UserColumnProps) => {
	return (
		<Box display='flex' alignItems='center'>
			{username && (
				<Box>
					<UserAvatar size={size} username={username} />
				</Box>
			)}
			<Box display='flex' mi={8} withTruncatedText>
				<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
					<Box fontScale='p2m' color='default' withTruncatedText>
						{name && username ? (
							<>
								{name}{' '}
								<Box display='inline-flex' fontWeight={300} fontSize={fontSize}>
									(@{username})
								</Box>
							</>
						) : (
							name || username
						)}{' '}
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default UserColumn;
