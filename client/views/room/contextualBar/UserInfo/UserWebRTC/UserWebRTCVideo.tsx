import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement, useEffect, useRef } from 'react';

type UserWebRTCVideoProps = {
	url?: MediaStream | void;
	screen?: boolean;
	muted?: boolean;
	ownUser?: boolean;
	isMainVideo?: boolean;
	videoEnabled: boolean;
};

const UserWebRTCVideo = ({ url, muted, ownUser, screen, isMainVideo }: UserWebRTCVideoProps): ReactElement => {
	const videoStream = useRef<HTMLVideoElement>(null);

	const videoFlipStyle = css`
		transform: scaleX(-1);
		filter: FlipH;
	`;

	useEffect(() => {
		if (!videoStream.current) {
			return;
		}

		if (muted) {
			videoStream.current.muted = true;
			videoStream.current.volume = 0;
		}

		if (url) {
			videoStream.current.srcObject = url;
		}
	}, [url, muted]);

	return (
		<Box
			width='full'
			minHeight={isMainVideo ? '300px' : 'auto'}
			is='video'
			ref={videoStream}
			autoPlay
			muted={muted}
			className={ownUser && !screen ? videoFlipStyle : ''}
		/>
	);
};

export default UserWebRTCVideo;
