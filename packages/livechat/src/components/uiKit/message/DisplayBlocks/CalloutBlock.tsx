import type * as uikit from '@rocket.chat/ui-kit';

import Block from '../Block';
import { cx } from './helpers';
import type { Parser } from './helpers';

export const CalloutBlock = ({
	appId,
	blockId,
	title,
	text,
	variant = 'info',
	accessory,
	parser,
}: uikit.CalloutBlock & { parser: Parser }) => (
	<Block appId={appId} blockId={blockId}>
		<div className={cx('uikit-callout', { variant })} role='note'>
			<div className={cx('uikit-callout__content')}>
				{title && <div className={cx('uikit-callout__title')}>{parser.renderTextObject(title, 0)}</div>}
				{parser.renderTextObject(text, 1)}
			</div>
			{accessory && <div className={cx('uikit-callout__accessory')}>{parser.renderSectionAccessoryBlockElement(accessory, 0)}</div>}
		</div>
	</Block>
);
