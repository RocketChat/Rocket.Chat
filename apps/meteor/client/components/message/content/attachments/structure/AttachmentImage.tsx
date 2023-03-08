import type { Dimensions } from '@rocket.chat/core-typings';
import { useAttachmentDimensions } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { memo, useState, useMemo } from 'react';

import ImageBox from './image/ImageBox';
import Load from './image/Load';
import Retry from './image/Retry';

type AttachmentImageProps = {
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
	const widthRatio = originalWidth / limits.width;
	const heightRatio = originalHeight / limits.height;

	if (widthRatio > heightRatio) {
		const width = Math.min(originalWidth, limits.width);
		return { width, height: (width / originalWidth) * originalHeight };
	}

	const height = Math.min(originalHeight, limits.height);
	return { width: (height / originalHeight) * originalWidth, height };
};

const AttachmentImage: FC<AttachmentImageProps> = ({ previewUrl, dataSrc, loadImage = true, setLoadImage, src, ...size }) => {
	const limits = useAttachmentDimensions();

	const [loaded, setLoaded] = useState(false);
	const [error, setError] = useState(false);

	const sizes = { width: size?.width || limits.width, height: size?.height || limits.height };

	const { setHasError, setHasNoError } = useMemo(
		() => ({
			setHasError: (): void => setError(true),
			setHasNoError: (): void => setError(false),
		}),
		[],
	);

	const dimensions = getDimensions(sizes.width, sizes.height, limits);

	if (!loadImage) {
		return <Load {...dimensions} {...limits} load={setLoadImage} />;
	}

	if (error) {
		return <Retry {...dimensions} retry={setHasNoError} />;
	}

	return (
		<ImageBox width={dimensions.width} height={loaded ? 'auto' : dimensions.height}>
			<img
				onError={setHasError}
				src={previewUrl}
				style={{
					opacity: loaded ? 0 : 1,
					maxWidth: '100%',
					width: loaded ? 'inherit' : dimensions.width,
					height: loaded ? 'inherit' : dimensions.height,
					transition: 'opacity .1s linear',
					position: 'absolute',
				}}
			/>
			<img
				className='gallery-item'
				onLoad={(): void => setLoaded(true)}
				onError={setHasError}
				data-src={dataSrc || src}
				src={src}
				style={{
					maxWidth: '100%',
					opacity: loaded ? 1 : 0,
					width: loaded ? 'inherit' : 0,
					height: loaded ? 'inherit' : 0,
					zIndex: 1,
				}}
			/>
		</ImageBox>
	);
};

export default memo(AttachmentImage);
