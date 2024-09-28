import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { ReactNode } from 'react';
import React, { useMemo, memo, useState, createContext, useRef } from 'react';

import VideoPortal from '../portals/VideoPortal';

type FloatingVideoProviderProps = {
	children?: ReactNode;
};

type VideoProps = {
	src: string;
	type: string;
};

type FloatingVideoContextValue = {
	playFloatingVideo: (videoProps: VideoProps) => void;
};

export const FloatingVideoContext = createContext<FloatingVideoContextValue>({
	playFloatingVideo: () => undefined,
});

const FloatingVideoProvider = ({ children }: FloatingVideoProviderProps) => {
	const [currentVideo, setCurrentVideo] = useState<ReactNode>(null);
	const currentVideoRef = useRef<HTMLSourceElement>(null);

	const playFloatingVideo = useEffectEvent((videoProps: VideoProps) => {
		setCurrentVideo(<source {...videoProps} ref={currentVideoRef} />);
	});

	// useEffect(() => {
	// 	if (currentVideo) {
	// 		if (!currentVideoRef.current) {
	// 			throw new Error('Missing video ref');
	// 		}
	// 		currentVideoRef.current.play();
	// 	}
	// }, [currentVideo]);

	const contextValue = useMemo(
		() => ({
			playFloatingVideo,
		}),
		[playFloatingVideo],
	);

	return (
		<FloatingVideoContext.Provider value={contextValue}>
			{children}
			{currentVideo && (
				<VideoPortal>
					<Box
						is='video'
						controls
						preload='metadata'
						autoPlay
						display='block'
						maxWidth={854}
						maxHeight={480}
						position='fixed'
						zIndex={999999}
						className={[
							css`
								top: 84px;
								right: 50px;
							`,
						]}
					>
						{currentVideo}
					</Box>
				</VideoPortal>
			)}
		</FloatingVideoContext.Provider>
	);
};

export default memo<typeof FloatingVideoProvider>(FloatingVideoProvider);
