import { Image as ASTImage } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

type ImageProps = {
	value: ASTImage['value'];
};

const style = {
	maxWidth: '100%',
};

const Image: FC<ImageProps> = ({ value }) => {
	const { src, label } = value;
	return (
		<a href={src.value} target='_blank' rel='noopener noreferrer'>
			<img src={src.value} data-title={src.value} alt={String(label.value)} style={style} />
		</a>
	);
};

export default Image;
