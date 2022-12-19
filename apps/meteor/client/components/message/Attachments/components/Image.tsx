import type { Dimensions } from '@rocket.chat/core-typings';
import { useAttachmentDimensions } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { memo, useState, useMemo } from 'react';

import ImageBox from './ImageBox';
import Load from './Load';
import Retry from './Retry';

type ImageProps = {
	previewUrl?: string;
	dataSrc?: string;
	src: string;
	loadImage?: boolean;
	setLoadImage: () => void;
} & Dimensions &
	({ loadImage: true } | { loadImage: false; setLoadImage: () => void });

const getDimensions = (
	originalWidth: Dimensions['width'],
	originalHeight: Dimensions['height'],
	limits: { width: number; height: number },
): { width: number; height: number } => {
	const widthRatio = originalWidth / (limits.width - 4);
	const heightRatio = originalHeight / limits.height;

	if (widthRatio > heightRatio) {
		const width = Math.min(originalWidth, limits.width - 4);
		return { width, height: (width / originalWidth) * originalHeight };
	}

	const height = Math.min(originalHeight, limits.height);
	return { width: (height / originalHeight) * originalWidth, height };
};

const Image: FC<ImageProps> = ({ previewUrl, dataSrc, loadImage = true, setLoadImage, src, ...size }) => {
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
		return <Load {...dimensions} {...limits} load={setLoadImage} />;
	}

	if (error) {
		return <Retry {...dimensions} retry={setHasNoError} />;
	}

	return (
		<ImageBox
			onError={setHasError}
			{...(previewUrl && ({ style: { background, boxSizing: 'content-box' } } as any))}
			{...dimensions}
			is='picture'
		>
			<img className='gallery-item' data-src={dataSrc || src} src={src} {...dimensions} />
		</ImageBox>
	);
};

export default memo(Image);
