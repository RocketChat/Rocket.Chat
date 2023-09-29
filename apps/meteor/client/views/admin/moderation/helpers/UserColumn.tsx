import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import UserAvatar from '../../../../components/avatar/UserAvatar';

type UserColumnProps = {
	name?: string;
	username?: string;
	isDesktopOrLarger: boolean;
};

const UserColumn = ({ name, username, isDesktopOrLarger }: UserColumnProps) => {
	return (
		<Box display='flex' alignItems='center'>
			{username && (
				<Box>
					<UserAvatar size={isDesktopOrLarger ? 'x20' : 'x40'} username={username} />
				</Box>
			)}
			<Box display='flex' mi={8} withTruncatedText>
				<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
					<Box fontScale='p2m' color='default' withTruncatedText>
						{name && username ? (
							<>
								{name}{' '}
								<Box display='inline-flex' fontWeight={100} fontSize='micro'>
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
