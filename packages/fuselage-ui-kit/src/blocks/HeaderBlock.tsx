import { Box } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import { memo } from 'react';

import type { BlockProps } from '../utils/BlockProps';

type HeaderBlockProps = BlockProps<UiKit.HeaderBlock>;

const HeaderBlock = ({ className, block, surfaceRenderer }: HeaderBlockProps) => (
	<Box is='h2' fontScale='h2' className={className} marginBlock={8}>
		{surfaceRenderer.renderTextObject(block.text, 0, UiKit.BlockContext.NONE)}
	</Box>
);

export default memo(HeaderBlock);
