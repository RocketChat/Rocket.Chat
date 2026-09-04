import type * as UiKit from '@rocket.chat/ui-kit';
import { memo } from 'react';

import MarkdownTextElement from '../elements/MarkdownTextElement';
import type { BlockProps } from '../utils/BlockProps';

type MarkdownBlockProps = BlockProps<UiKit.MarkdownBlock>;

const MarkdownBlock = ({ block }: MarkdownBlockProps) => <MarkdownTextElement textObject={{ type: 'mrkdwn', text: block.text }} />;

export default memo(MarkdownBlock);
