import React, { memo, FC } from 'react';

type AudioProps = {
	src: string;
};

const Audio: FC<AudioProps> = ({ src }) => (
	<audio controls>
		<source src={src} data-rel='noopener noreferrer' />
		Your browser does not support the audio element.
	</audio>
);

export default memo(Audio);
