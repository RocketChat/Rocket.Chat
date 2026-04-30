import { Box } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useUser, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import MediaCallRoomSection from './MediaCallRoomSection';
import MediaCallViewProvider from '../../providers/MediaCallViewProvider';
import MediaCallPopoutWindow from '../MediaCallPopoutWindow';

type MediaCallRoomActivityProps = {
	children: ReactNode;
};

const MediaCallRoomActivity = ({ children }: MediaCallRoomActivityProps) => {
	const [showChat, setShowChat] = useState(true);
	const [isPopout, setIsPopout] = useState(false);

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

	const mediaCallRoomSection = (
		<MediaCallViewProvider>
			<MediaCallRoomSection
				showChat={showChat}
				onToggleChat={() => setShowChat((prev) => !prev)}
				user={ownUser}
				containerHeight={borderBoxSize?.blockSize || 0}
				onPopout={() => setIsPopout((prev) => !prev)}
				isPopout={isPopout}
				key={isPopout ? 'popout' : 'normal'}
			/>
		</MediaCallViewProvider>
	);

	// TODO: this shouldn't be inside here, since the popout has to be always rendered.
	if (isPopout) {
		return (
			<>
				<MediaCallPopoutWindow restoreDefaultView={() => setIsPopout(false)}>
					<Box w='full' h='full' display='flex' flexDirection='column' justifyContent='space-between' ref={ref}>
						{mediaCallRoomSection}
					</Box>
				</MediaCallPopoutWindow>
				{children}
			</>
		);
	}

	return (
		<Box w='full' h='full' display='flex' flexDirection='column' justifyContent='space-between' ref={ref}>
			{mediaCallRoomSection}
			{showChat && (
				<Box w='full' flexGrow={2} flexShrink={0}>
					{children}
				</Box>
			)}
		</Box>
	);
};

export default MediaCallRoomActivity;
