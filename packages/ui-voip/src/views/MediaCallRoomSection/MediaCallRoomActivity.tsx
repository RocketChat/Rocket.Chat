import { Box } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useUser, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';

import MediaCallRoomSection from './MediaCallRoomSection';
import { useMediaCallInstance } from '../../context';
import type { AvailableViews } from '../../context/MediaCallInstanceContext';
import MediaCallViewProvider from '../../providers/MediaCallViewProvider';
// import MediaCallPopoutWindow from '../MediaCallPopoutWindow';

type MediaCallRoomActivityProps = {
	children: ReactNode;
};

const MediaCallRoomActivity = ({ children }: MediaCallRoomActivityProps) => {
	const [showChat, setShowChat] = useState(true);
	const { setCurrentViews } = useMediaCallInstance();

	const togglePopout = useCallback(() => {
		setCurrentViews((prev) => {
			if (prev.has('popout')) {
				prev.delete('popout');
			} else {
				prev.add('popout');
			}

			return new Set<AvailableViews>(prev);
		});
	}, [setCurrentViews]);

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

	return (
		<Box w='full' h='full' display='flex' flexDirection='column' justifyContent='space-between' ref={ref}>
			<MediaCallViewProvider>
				<MediaCallRoomSection
					showChat={showChat}
					onToggleChat={() => setShowChat((prev) => !prev)}
					user={ownUser}
					containerHeight={borderBoxSize?.blockSize || 0}
					onPopout={togglePopout}
					isPopout={false}
				/>
			</MediaCallViewProvider>
			{showChat && (
				<Box w='full' flexGrow={2} flexShrink={0}>
					{children}
				</Box>
			)}
		</Box>
	);
};

export default MediaCallRoomActivity;
