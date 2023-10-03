import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import UserAvatar from '../../../../components/avatar/UserAvatar';

type UserColumnProps = {
	name?: string;
	username?: string;
};

const UserProfile = ({ name, username }: UserColumnProps) => {
	return (
		<Box display='flex' alignItems='center'>
			{username && (
				<Box>
					<UserAvatar size='x48' username={username} />
				</Box>
			)}
			<Box display='flex' mi={8} withTruncatedText>
				<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
					<Box fontScale='p1' color='default' withTruncatedText>
						{name && username ? (
							<>
								{name}{' '}
								<Box display='inline-flex' fontWeight={300} fontSize='p2'>
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

export default UserProfile;
