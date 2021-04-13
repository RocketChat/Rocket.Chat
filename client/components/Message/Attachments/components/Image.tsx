import React, { memo, FC, useState, useMemo } from 'react';

import { useAttachmentDimensions } from '../context/AttachmentContext';
import { Dimensions } from './Dimensions';
import ImageBox from './ImageBox';
import Load from './Load';
import Retry from './Retry';

type ImageProps = {
	previewUrl?: string;
	src: string;
	loadImage?: boolean;
	setLoadImage: () => void;
} & Dimensions &
	({ loadImage: true } | { loadImage: false; setLoadImage: () => void });

const getDimensions = (
	width: Dimensions['width'],
	height: Dimensions['height'],
	limits: { width: number; height: number },
): { width: 'auto' | number; height: 'auto' | number } => {
	const ratio = height / width;

	if (height >= width || Math.min(width, limits.width) * ratio > limits.height) {
		return { width: (width * Math.min(height, limits.height)) / height, height: 'auto' };
	}

	return { width: Math.min(width, limits.width), height: 'auto' };
};

const Image: FC<ImageProps> = ({ previewUrl, loadImage = true, setLoadImage, src, ...size }) => {
	const limits = useAttachmentDimensions();
	const { width = limits.width, height = limits.height } = size;
	const [error, setError] = useState(false);

	const { setHasError, setHasNoError } = useMemo(
		() => ({
			setHasError: (): void => setError(true),
			setHasNoError: (): void => setError(false),
		}),
		[],
	);

	const dimensions = getDimensions(width, height, limits);

	const background = previewUrl && `url(${previewUrl}) center center / cover no-repeat fixed`;

	if (!loadImage) {
		return <Load {...limits} load={setLoadImage} />;
	}

	if (error) {
		return <Retry retry={setHasNoError} />;
	}

	return (
		<ImageBox
			className='gallery-item'
			onError={setHasError}
			{...(previewUrl && ({ style: { background } } as any))}
			{...dimensions}
			src={src}
			is='img'
		/>
	);
};

export default memo(Image);
