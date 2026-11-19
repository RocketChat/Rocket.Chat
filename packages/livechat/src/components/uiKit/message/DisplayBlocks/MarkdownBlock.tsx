import type * as uikit from '@rocket.chat/ui-kit';

import Block from '../Block';
import Mrkdwn from '../Mrkdwn';
import { cx } from './helpers';

export const MarkdownBlock = ({ appId, blockId, text }: uikit.MarkdownBlock) => (
	<Block appId={appId} blockId={blockId}>
		<div className={cx('uikit-markdown')}>
			<Mrkdwn text={text} />
		</div>
	</Block>
);
