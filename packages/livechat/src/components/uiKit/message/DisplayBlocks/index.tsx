import type * as uikit from '@rocket.chat/ui-kit';

import Block from '../Block';
import { cx } from './helpers';

export { MarkdownBlock } from './MarkdownBlock';
export { CalloutBlock } from './CalloutBlock';
export { TableBlock } from './TableBlock';
export { VideoBlock, isEmbeddable } from './VideoBlock';
export { PreviewBlock } from './PreviewBlock';
export { ContextActionsBlock } from './ContextActionsBlock';

export const HeaderBlock = ({ appId, blockId, text }: uikit.HeaderBlock) => (
	<Block appId={appId} blockId={blockId}>
		<h3 className={cx('uikit-header')}>{text.text}</h3>
	</Block>
);
