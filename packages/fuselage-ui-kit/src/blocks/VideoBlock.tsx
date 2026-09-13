import { Box } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import { memo } from 'react';

import type { BlockProps } from '../utils/BlockProps';

const maxWidth = 360;

type VideoBlockProps = BlockProps<UiKit.VideoBlock>;

const VideoBlock = ({ className, block, surfaceRenderer }: VideoBlockProps) => {
	const title = surfaceRenderer.renderTextObject(block.title, 0, UiKit.BlockContext.NONE);

	return (
		<Box className={className} display='flex' flexDirection='column' maxWidth={maxWidth}>
			<Box fontScale='c1' color='hint' withTruncatedText marginBlockEnd={4}>
				{block.titleUrl ? (
					<Box is='a' href={block.titleUrl} target='_blank' rel='noopener noreferrer'>
						{title}
					</Box>
				) : (
					title
				)}
			</Box>
			<Box
				is='iframe'
				src={block.videoUrl}
				title={block.altText}
				width='100%'
				height={(maxWidth * 9) / 16}
				borderWidth={0}
				allowFullScreen
			/>
			{block.description && (
				<Box fontScale='c1' color='hint' marginBlockStart={4}>
					{surfaceRenderer.renderTextObject(block.description, 0, UiKit.BlockContext.NONE)}
				</Box>
			)}
		</Box>
	);
};

export default memo(VideoBlock);
