import { Box, Icon } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import { memo, useCallback, useState } from 'react';

import type { BlockProps } from '../utils/BlockProps';
import { isTextObject } from '../utils/isTextObject';

export type VideoBlockProps = BlockProps<UiKit.VideoBlock>;

const maxWidth = 480;

// The frame keeps its origin so players can run; a page from the workspace's own origin could then reach out of the sandbox.
const isPlayableUrl = (url: string) => {
	try {
		const { protocol, origin } = new URL(url);
		return protocol === 'https:' && origin !== window.location.origin;
	} catch {
		return false;
	}
};

const VideoBlock = ({ className, block, surfaceRenderer }: VideoBlockProps) => {
	// Remembers the clicked URL, so a block replaced with another video shows its thumbnail again.
	const [playedUrl, setPlayedUrl] = useState<string>();
	const focusPlayer = useCallback((player: HTMLIFrameElement | null) => player?.focus(), []);

	const playable = isPlayableUrl(block.video_url);
	const titleUrl = block.title_url && UiKit.isSafeUrl(block.title_url) ? block.title_url : undefined;
	const providerIconUrl = block.provider_icon_url && UiKit.isSafeUrl(block.provider_icon_url) ? block.provider_icon_url : undefined;
	const title = isTextObject(block.title) ? surfaceRenderer.renderTextObject(block.title, 0, UiKit.BlockContext.NONE) : null;

	return (
		<Box className={className} maxWidth={maxWidth} display='flex' flexDirection='column'>
			<Box
				position='relative'
				width='full'
				borderRadius='medium'
				overflow='hidden'
				backgroundColor='surface-tint'
				style={{ aspectRatio: '16 / 9' }}
			>
				{playedUrl === block.video_url && playable ? (
					<iframe
						ref={focusPlayer}
						src={block.video_url}
						title={block.alt_text}
						allow='autoplay; encrypted-media; picture-in-picture; fullscreen'
						allowFullScreen
						sandbox='allow-scripts allow-same-origin allow-presentation allow-popups'
						// Players such as YouTube refuse to play without the embedding page's origin.
						referrerPolicy='strict-origin-when-cross-origin'
						style={{ width: '100%', height: '100%', border: 0 }}
					/>
				) : (
					<Box
						is='button'
						type='button'
						aria-label={block.alt_text}
						disabled={!playable}
						onClick={() => setPlayedUrl(block.video_url)}
						position='relative'
						width='full'
						height='full'
						padding={0}
						borderWidth='none'
						style={{ background: 'none', cursor: playable ? 'pointer' : 'default' }}
						display='flex'
						alignItems='center'
						justifyContent='center'
					>
						<Box
							is='img'
							src={block.thumbnail_url}
							alt={block.alt_text}
							position='absolute'
							width='full'
							height='full'
							style={{ objectFit: 'cover', inset: 0 }}
						/>
						{playable && (
							<Box position='relative' display='flex' padding={12} borderRadius='full' backgroundColor='surface-light' color='default'>
								<Icon name='play-solid' size='x32' />
							</Box>
						)}
					</Box>
				)}
			</Box>
			<Box marginBlockStart={8} fontScale='p2b' color='default'>
				{titleUrl ? (
					<Box is='a' href={titleUrl} target='_blank' rel='noopener noreferrer'>
						{title}
					</Box>
				) : (
					title
				)}
			</Box>
			{isTextObject(block.description) && (
				<Box fontScale='p2' color='hint'>
					{surfaceRenderer.renderTextObject(block.description, 0, UiKit.BlockContext.NONE)}
				</Box>
			)}
			{(block.provider_name || block.author_name) && (
				<Box display='flex' alignItems='center' marginBlockStart={4} fontScale='c1' color='hint'>
					{providerIconUrl && <Box is='img' src={providerIconUrl} alt='' width={16} height={16} marginInlineEnd={4} />}
					{[block.provider_name, block.author_name].filter(Boolean).join(' · ')}
				</Box>
			)}
		</Box>
	);
};

export default memo(VideoBlock);
