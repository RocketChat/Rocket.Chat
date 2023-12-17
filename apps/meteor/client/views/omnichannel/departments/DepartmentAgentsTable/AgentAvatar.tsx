import { Box } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React, { memo } from 'react';

import UserAvatar from '../../../../components/avatar/UserAvatar';

const AgentAvatar = ({ name, username, eTag }: { name: string; username: string; eTag?: string }) => {
	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	return (
		<Box display='flex' alignItems='center'>
			<UserAvatar size={mediaQuery ? 'x28' : 'x40'} title={username} username={username} etag={eTag} />
			<Box display='flex' withTruncatedText mi={8}>
				<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
					<Box fontScale='p2m' withTruncatedText color='default'>
						{name || username}
					</Box>
					{!mediaQuery && name && (
						<Box fontScale='p2' color='hint' withTruncatedText>
							{' '}
							{`@${username}`}{' '}
						</Box>
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default memo(AgentAvatar);
