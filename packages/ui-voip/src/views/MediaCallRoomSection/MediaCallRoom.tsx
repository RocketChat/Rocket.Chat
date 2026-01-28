import { Box } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
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

	const { ref, borderBoxSize } = useResizeObserver<HTMLDivElement>();

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
		<Box w='full' h='full' display='flex' flexDirection='column' justifyContent='space-between' ref={ref}>
			<MediaCallRoomSection
				showChat={showChat}
				onToggleChat={onClickToggleChat}
				user={ownUser}
				containerHeight={borderBoxSize?.blockSize || 0}
			/>

			{showChat && (
				<Box w='full' flexGrow={2} flexShrink={0}>
					{body}
				</Box>
			)}
		</Box>
	);
};

export default MediaCallRoom;
