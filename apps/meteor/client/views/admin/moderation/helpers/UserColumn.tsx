import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import UserAvatar from '../../../../components/avatar/UserAvatar';

type UserColumnProps = {
	name?: string;
	username?: string;
	isDesktopOrLarger?: boolean;
	isProfile?: boolean;
};

const UserColumn = ({ name, username, isDesktopOrLarger, isProfile }: UserColumnProps) => {
	let size: 'x40' | 'x20' | 'x48' = 'x40';
	if (isProfile) size = 'x48';
	else if (isDesktopOrLarger) size = 'x20';

	return (
		<Box display='flex' alignItems='center'>
			{username && (
				<Box>
					<UserAvatar sizes={size} username={username} />
				</Box>
			)}
			<Box display='flex' mi={8} withTruncatedText>
				<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
					<Box fontScale='p2m' color='default' withTruncatedText>
						{name && username ? (
							<>
								{name}{' '}
								<Box display='inline-flex' fontWeight={300} fontSize={isProfile ? 'p2' : 'micro'}>
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
