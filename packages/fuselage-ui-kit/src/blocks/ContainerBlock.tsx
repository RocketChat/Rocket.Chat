import { Box, Divider, IconButton } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import { memo, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { BlockProps } from '../utils/BlockProps';
import { isTextObject } from '../utils/isTextObject';
import { messageBlockWidth } from '../utils/messageBlockWidth';
import { renderNestedBlocks } from '../utils/renderNestedBlocks';

export type ContainerBlockProps = BlockProps<UiKit.ContainerBlock>;

const maxWidths = { narrow: 280, standard: messageBlockWidth, wide: 640, full: undefined } as const;

const ContainerBlock = ({ className, block, surfaceRenderer }: ContainerBlockProps) => {
	const { t } = useTranslation();
	const contentId = useId();
	const collapsible = block.is_collapsible === true;
	const [collapsed, setCollapsed] = useState(collapsible && block.default_collapsed === true);

	const icon = block.icon && typeof block.icon.image_url === 'string' && UiKit.isSafeUrl(block.icon.image_url) ? block.icon : undefined;
	const renderText = (text: UiKit.TextObject | undefined) =>
		isTextObject(text) ? surfaceRenderer.renderTextObject(text, 0, UiKit.BlockContext.NONE) : null;

	// Only a rich_text block may stand in a title: anything else would sidestep the limits of the block it is.
	const richTitle = block.rich_text_title?.type === 'rich_text' ? surfaceRenderer.render([block.rich_text_title]) : [];
	const title = richTitle.length ? richTitle : renderText(block.title);
	const subtitle = renderText(block.subtitle);
	const children = useMemo(
		() => renderNestedBlocks(surfaceRenderer, block.child_blocks, UiKit.containerChildBlockTypes, block),
		[surfaceRenderer, block],
	);

	return (
		<Box
			className={className}
			display='flex'
			flexDirection='column'
			width='full'
			maxWidth={maxWidths[block.width ?? 'standard']}
			borderWidth='default'
			borderColor='extra-light'
			borderRadius='large'
		>
			<Box display='flex' alignItems='center' gap='x12' padding='x12'>
				{icon && <Box is='img' src={icon.image_url} alt={icon.alt_text} size='x36' borderRadius='medium' flexShrink={0} />}
				<Box display='flex' flexDirection='column' flexGrow={1} minWidth={0}>
					{title && (
						<Box is='h3' fontScale='h5' color='default'>
							{title}
						</Box>
					)}
					{subtitle && (
						<Box fontScale='c1' color='annotation'>
							{subtitle}
						</Box>
					)}
				</Box>
				{collapsible && (
					<IconButton
						size='small'
						icon={collapsed ? 'chevron-down' : 'chevron-up'}
						title={t(collapsed ? 'Expand' : 'Collapse')}
						aria-expanded={!collapsed}
						aria-controls={contentId}
						onClick={() => setCollapsed((value) => !value)}
					/>
				)}
			</Box>
			{block.has_header_divider && !collapsible && <Divider flush />}
			<Box id={contentId} hidden={collapsed}>
				<Box display='flex' flexDirection='column' gap='x8' padding='x12'>
					{children}
				</Box>
			</Box>
		</Box>
	);
};

export default memo(ContainerBlock);
