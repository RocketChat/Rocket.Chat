import { Box, Skeleton } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import { memo, useEffect, useState } from 'react';

import { Image } from './ImageBlock.styles';
import type { BlockProps } from '../utils/BlockProps';

const fetchImageState = (img: HTMLImageElement) => {
	if (!img.complete) {
		return { loading: true, naturalWidth: 0, naturalHeight: 0 };
	}

	return { loading: false, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight };
};

export type ImageBlockProps = BlockProps<UiKit.ImageBlock>;

const ImageBlock = ({ className, block, surfaceRenderer }: ImageBlockProps) => {
	const [{ loading, naturalWidth, naturalHeight }, setState] = useState(() => {
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

	return (
		<Box className={className} display='flex' flexDirection='column' flexWrap='nowrap'>
			<Box overflow='hidden' width='full'>
				{block.title && (
					<Box fontScale='c1' color='hint' withTruncatedText marginBlockEnd={4}>
						{surfaceRenderer.renderTextObject(block.title, 0, UiKit.BlockContext.NONE)}
					</Box>
				)}
				{loading ? (
					<Box display='flex' borderRadius='large' overflow='hidden'>
						<Skeleton variant='rect' width='100%' style={{ aspectRatio: '21 / 9' }} />
					</Box>
				) : (
					<Image imageUrl={block.imageUrl} width={naturalWidth} height={naturalHeight} aria-label={block.altText} />
				)}
			</Box>
		</Box>
	);
};

export default memo(ImageBlock);
