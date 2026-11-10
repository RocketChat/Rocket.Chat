import { Box } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import type { ReactNode } from 'react';
import { useState } from 'react';

import MediaCallRoomSection from './MediaCallRoomSection';
import { useMediaCallViewer } from '../../hooks/useMediaCallViewer';
import MediaCallViewProvider from '../../providers/MediaCallViewProvider';

export type MediaCallRoomActivityProps = {
	children: ReactNode;
};

const MediaCallRoomActivity = ({ children }: MediaCallRoomActivityProps) => {
	const [showChat, setShowChat] = useState(true);
	const ownUser = useMediaCallViewer();

	const { ref, borderBoxSize } = useResizeObserver<HTMLDivElement>();

	const onClickToggleChat = () => {
		setShowChat((prev) => !prev);
	};
	return (
		<Box width='full' height='full' display='flex' flexDirection='column' justifyContent='space-between' ref={ref}>
			<MediaCallViewProvider>
				<MediaCallRoomSection
					showChat={showChat}
					onToggleChat={onClickToggleChat}
					user={ownUser}
					containerHeight={borderBoxSize?.blockSize || 0}
				/>
			</MediaCallViewProvider>

			{showChat && (
				<Box width='full' flexGrow={2} flexShrink={0}>
					{children}
				</Box>
			)}
		</Box>
	);
};

export default MediaCallRoomActivity;
