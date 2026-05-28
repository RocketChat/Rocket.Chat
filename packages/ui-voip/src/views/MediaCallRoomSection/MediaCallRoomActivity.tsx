import { Box } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useUser, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import type { ComponentType, ReactNode } from 'react';
import { useMemo, useState } from 'react';

import MediaCallRoomSection from './MediaCallRoomSection';
import MediaCallViewProvider from '../../providers/MediaCallViewProvider';

type MediaCallRoomActivityProps = {
	children: ReactNode;
	/**
	 * Provider that populates MediaCallViewContext. Default is the 1:1 session-driven
	 * provider; group calls pass a LiveKit-driven provider instead. Keeps the rest of
	 * the activity (layout, showChat, ResizeObserver, etc.) shared across both call kinds.
	 */
	Provider?: ComponentType<{ children: ReactNode }>;
};

const MediaCallRoomActivity = ({ children, Provider = MediaCallViewProvider }: MediaCallRoomActivityProps) => {
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
			<Provider>
				<MediaCallRoomSection
					showChat={showChat}
					onToggleChat={onClickToggleChat}
					user={ownUser}
					containerHeight={borderBoxSize?.blockSize || 0}
				/>
			</Provider>

			{showChat && (
				<Box w='full' flexGrow={2} flexShrink={0}>
					{children}
				</Box>
			)}
		</Box>
	);
};

export default MediaCallRoomActivity;
