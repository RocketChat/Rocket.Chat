import { Box } from '@rocket.chat/fuselage';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useUser, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import MediaCallRoomSection from './MediaCallRoomSection';

const MediaCallRoom = ({ body }: { body: ReactNode }) => {
	const [showChat, setShowChat] = useState(true);
	const user = useUser();

	const displayName = useUserDisplayName({ name: user?.name, username: user?.username });
	const getUserAvatarPath = useUserAvatarPath();

	const ownUser = useMemo(() => {
		return {
			displayName: displayName || '',
			avatarUrl: getUserAvatarPath({ userId: user?._id || '' }),
		};
	}, [displayName, getUserAvatarPath, user?._id]);

	const onClickToggleChat = () => {
		setShowChat((prev) => !prev);
	};
	return (
		<Box
			w='full'
			h='full'
			// bg='hover'
			// flexShrink={0}
			// borderBlockEnd='1px solid'
			// borderBlockEndColor='stroke-light'
			display='flex'
			flexDirection='column'
			justifyContent='space-between'
		>
			<MediaCallRoomSection showChat={showChat} onToggleChat={onClickToggleChat} user={ownUser} />

			{showChat && (
				<Box w='full' flexGrow={2} flexShrink={0}>
					{body}
				</Box>
			)}
		</Box>
	);
};

export default MediaCallRoom;
