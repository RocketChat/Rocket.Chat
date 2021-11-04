import React, { memo, FC } from 'react';

type VideoProps = {
	src: string;
};

const Video: FC<VideoProps> = ({ src }) => {
	console.log('video', src);
	return (
		<video controls className='inline-video'>
			<source src={src} data-rel='noopener noreferrer' />
			Your browser does not support the video element.
		</video>
	);
};

export default memo(Video);
