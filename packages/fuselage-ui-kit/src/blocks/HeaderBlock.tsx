import { Box } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import { memo } from 'react';

import type { BlockProps } from '../utils/BlockProps';

export type HeaderBlockProps = BlockProps<UiKit.HeaderBlock>;

const HeaderBlock = ({ className, block, surfaceRenderer }: HeaderBlockProps) => (
	<Box className={className} is='h3' fontScale='h4' color='default' marginBlockEnd={8}>
		{surfaceRenderer.renderTextObject(block.text, 0, UiKit.BlockContext.NONE)}
	</Box>
);

export default memo(HeaderBlock);
