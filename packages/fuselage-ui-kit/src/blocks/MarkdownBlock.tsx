import { Box } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import { memo } from 'react';

import MarkdownTextElement from '../elements/MarkdownTextElement';
import type { BlockProps } from '../utils/BlockProps';

export type MarkdownBlockProps = BlockProps<UiKit.MarkdownBlock>;

const MarkdownBlock = ({ className, block }: MarkdownBlockProps) => (
	<Box className={className} fontScale='p2' color='default'>
		<MarkdownTextElement textObject={{ type: 'mrkdwn', text: block.text }} />
	</Box>
);

export default memo(MarkdownBlock);
