import type { CSSProperties } from 'react';

import { usePlayMediaStream } from './usePlayMediaStream';

export type StreamVideoProps = {
	stream: MediaStream | null | undefined;
	/** `contain` letterboxes a shared screen; `cover` fills a tile with a camera. */
	fit?: 'contain' | 'cover';
	/** Flipped, as a self-view is, so it reads as a mirror rather than as someone else's camera. */
	mirrored?: boolean;
	style?: CSSProperties;
};

/** A stream's picture, filling its box. Muted: the call's audio is played elsewhere. */
const StreamVideo = ({ stream, fit = 'contain', mirrored = false, style }: StreamVideoProps) => {
	const [videoRef] = usePlayMediaStream(stream ?? null);

	return (
		<video
			ref={videoRef}
			playsInline
			preload='metadata'
			muted
			style={{ width: '100%', height: '100%', objectFit: fit, transform: mirrored ? 'scaleX(-1)' : undefined, ...style }}
		>
			<track kind='captions' />
		</video>
	);
};

export default StreamVideo;
