import type * as uikit from '@rocket.chat/ui-kit';

import Block from '../Block';
import PlainText from '../PlainText';
import { cx } from './helpers';

export { MarkdownBlock } from './MarkdownBlock';
export { CalloutBlock } from './CalloutBlock';
export { TableBlock } from './TableBlock';
export { VideoBlock, isEmbeddable } from './VideoBlock';
export { PreviewBlock } from './PreviewBlock';
export { ContextActionsBlock } from './ContextActionsBlock';

export const HeaderBlock = ({ appId, blockId, text }: uikit.HeaderBlock) => (
	<Block appId={appId} blockId={blockId}>
		<h3 className={cx('uikit-header')}>
			<PlainText text={text.text} emoji={text.emoji} />
		</h3>
	</Block>
);
