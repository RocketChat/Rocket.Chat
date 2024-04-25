import type { Dimensions } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useAttachmentDimensions } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { FC } from 'react';
import React, { memo, useState, useMemo } from 'react';

import { e2e } from '../../../../../../app/e2e/client';
import ImageBox from './image/ImageBox';
import Load from './image/Load';
import Retry from './image/Retry';

type AttachmentImageProps = {
	previewUrl?: string;
	dataSrc?: string;
	src: string;
	loadImage?: boolean;
	setLoadImage: () => void;
	id: string | undefined;
} & Dimensions &
	({ loadImage: true } | { loadImage: false; setLoadImage: () => void });

const getDimensions = (
	originalWidth: Dimensions['width'],
	originalHeight: Dimensions['height'],
	limits: { width: number; height: number },
): { width: number; height: number; ratio: number } => {
	const widthRatio = originalWidth / limits.width;
	const heightRatio = originalHeight / limits.height;

	if (widthRatio > heightRatio) {
		const width = Math.min(originalWidth, limits.width);
		const height = (width / originalWidth) * originalHeight;
		return { width, height, ratio: (height / width) * 100 };
	}

	const height = Math.min(originalHeight, limits.height);
	const width = (height / originalHeight) * originalWidth;
	return { width, height, ratio: (height / width) * 100 };
};

const AttachmentImage: FC<AttachmentImageProps> = ({ id, previewUrl, dataSrc, loadImage = true, setLoadImage, src, message, ...size }) => {
	const limits = useAttachmentDimensions();

	const [error, setError] = useState(false);

	const { width = limits.width, height = limits.height } = size;

	const { setHasNoError } = useMemo(
		() => ({
			setHasNoError: (): void => setError(false),
		}),
		[],
	);

	async function imageUrlToBase64(blob: Blob) {
		return new Promise((onSuccess, onError) => {
			try {
				const reader = new FileReader();
				reader.onload = function () {
					onSuccess(this.result);
				};
				reader.readAsDataURL(blob);
			} catch (e) {
				onError(e);
			}
		});
	}

	async function imageUrlArrayBuffer(blob: Blob) {
		return new Promise((onSuccess, onError) => {
			try {
				const reader = new FileReader();
				reader.onload = function () {
					onSuccess(this.result);
				};
				reader.readAsArrayBuffer(blob);
			} catch (e) {
				onError(e);
			}
		});
	}

	const base64 = useQuery(
		[src],
		async () => {
			const file = await fetch(src);
			const blob = await file.blob();
			if (message.e2e) {
				const { key, iv } = JSON.parse(message.e2e);
				const e2eRoom = await e2e.getInstanceByRoomId(message.rid);

				const file = await e2eRoom.decryptFile(await imageUrlArrayBuffer(blob), key, iv);
				return imageUrlToBase64(new Blob([file]));
			}
			return imageUrlToBase64(blob);
		},
		{
			suspense: true,
		},
	);

	const dimensions = getDimensions(width, height, limits);

	const background = previewUrl && `url(${previewUrl}) center center / cover no-repeat fixed`;

	if (!loadImage) {
		return <Load width={dimensions.width || limits.width} height={dimensions.height || limits.height} load={setLoadImage} />;
	}

	if (error) {
		return <Retry width={dimensions.width} height={dimensions.height} retry={setHasNoError} />;
	}

	return (
		<Box width={dimensions.width} maxWidth='full' position='relative'>
			<Box pbs={`${dimensions.ratio}%`} position='relative'>
				<ImageBox
					is='picture'
					position='absolute'
					onError={() => setError(true)}
					style={{
						...(previewUrl && { background, boxSizing: 'content-box' }),
						top: 0,
						left: 0,
						bottom: 0,
						right: 0,
					}}
				>
					<img
						data-id={id}
						className='gallery-item'
						data-src={dataSrc || src}
						src={base64.data}
						alt=''
						width={dimensions.width}
						height={dimensions.height}
					/>
				</ImageBox>
			</Box>
		</Box>
	);
};

export default memo(AttachmentImage);
