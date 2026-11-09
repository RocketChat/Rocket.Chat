import { Box, Skeleton } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import { memo, useEffect, useState } from 'react';

import { Image } from './ImageBlock.styles';
import { useSurfaceType } from '../hooks/useSurfaceType';
import type { BlockProps } from '../utils/BlockProps';

const maxSize = 360;

const fetchImageState = (img: HTMLImageElement) => {
	if (!img.complete) {
		return {
			loading: true,
			width: maxSize,
			height: (maxSize * 9) / 21,
			naturalWidth: 0,
			naturalHeight: 0,
		};
	}

	const { naturalWidth, naturalHeight } = img;

	const scaleRatio =
		naturalWidth > naturalHeight ? Math.min(naturalWidth, maxSize) / naturalWidth : Math.min(naturalHeight, maxSize) / naturalHeight;

	return {
		loading: false,
		width: naturalWidth * scaleRatio,
		height: naturalHeight * scaleRatio,
		naturalWidth,
		naturalHeight,
	};
};

export type ImageBlockProps = BlockProps<UiKit.ImageBlock>;

const ImageBlock = ({ className, block, surfaceRenderer }: ImageBlockProps) => {
	const surface = useSurfaceType();

	const alignment = surface === 'banner' || surface === 'message' ? 'flex-start' : 'center';

	const [{ loading, width, height, naturalWidth, naturalHeight }, setState] = useState(() => {
		const img = document.createElement('img');
		img.src = block.imageUrl;
		return fetchImageState(img);
	});

	useEffect(() => {
		const img = document.createElement('img');

		const handleLoad = () => {
			setState(fetchImageState(img));
		};

		img.addEventListener('load', handleLoad);
		img.src = block.imageUrl;

		if (img.complete) {
			img.removeEventListener('load', handleLoad);
			setState(fetchImageState(img));
		}

		return () => {
			img.removeEventListener('load', handleLoad);
		};
	}, [block.imageUrl]);

	// In a message, a landscape image fills the message block like link previews and attachments do; portrait ones keep the height limit.
	const fluid = surface === 'message' && !loading && naturalWidth >= naturalHeight;

	return (
		<Box className={className} display='flex' flexDirection='column' flexWrap='nowrap' alignItems={alignment}>
			<Box overflow='hidden' width={fluid ? '100%' : width}>
				{block.title && (
					<Box fontScale='c1' color='hint' withTruncatedText marginBlockEnd={4}>
						{surfaceRenderer.renderTextObject(block.title, 0, UiKit.BlockContext.NONE)}
					</Box>
				)}
				{loading ? (
					<Box display='flex' borderRadius='large' overflow='hidden'>
						<Skeleton variant='rect' width={width} height={height} />
					</Box>
				) : (
					<Image
						imageUrl={block.imageUrl}
						width={fluid ? naturalWidth : width}
						height={fluid ? naturalHeight : height}
						fluid={fluid}
						aria-label={block.altText}
					/>
				)}
			</Box>
		</Box>
	);
};

export default memo(ImageBlock);
