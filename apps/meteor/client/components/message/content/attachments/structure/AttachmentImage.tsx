import type { Dimensions } from '@rocket.chat/core-typings';
import { useAttachmentDimensions } from '@rocket.chat/ui-contexts';
import type { FC, SyntheticEvent } from 'react';
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

interface IPictureLoadEvent extends SyntheticEvent {
	target: HTMLImageElement;
}

const AttachmentImage: FC<AttachmentImageProps> = ({ previewUrl, dataSrc, loadImage = true, setLoadImage, src, ...size }) => {
	const limits = useAttachmentDimensions();

	const [error, setError] = useState(false);

	const [sizes, setSizes] = useState({ width: size?.width || limits.width, height: size?.height || limits.height });

	const hasSizes = useMemo(
		() =>
			size?.width || size?.height
				? undefined
				: (e: IPictureLoadEvent) => setSizes({ width: e.target.naturalWidth, height: e.target.naturalHeight }),
		[size],
	);

	const { setHasError, setHasNoError } = useMemo(
		() => ({
			setHasError: (): void => setError(true),
			setHasNoError: (): void => setError(false),
		}),
		[],
	);

	const dimensions = getDimensions(sizes.width, sizes.height, limits);

	const background = previewUrl && `url(${previewUrl}) center center / cover no-repeat fixed`;

	if (!loadImage) {
		return <Load {...dimensions} {...limits} load={setLoadImage} />;
	}

	if (error) {
		return <Retry {...dimensions} retry={setHasNoError} />;
	}

	return (
		<ImageBox
			is='picture'
			onLoad={hasSizes}
			onError={setHasError}
			{...(previewUrl && ({ style: { background, boxSizing: 'content-box' } } as any))}
			{...dimensions}
		>
			<img className='gallery-item' data-src={dataSrc || src} src={src} {...dimensions} />
		</ImageBox>
	);
};

export default memo(AttachmentImage);
