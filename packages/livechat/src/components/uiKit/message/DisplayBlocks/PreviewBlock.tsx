import type * as uikit from '@rocket.chat/ui-kit';

import Block from '../Block';
import { cx, safeUrl } from './helpers';
import type { Parser } from './helpers';

export const PreviewBlock = (block: uikit.PreviewBlock & { parser: Parser }) => {
	const { appId, blockId, title, description, footer, parser } = block;
	let image;
	if ('thumb' in block && block.thumb) {
		image = block.thumb;
	} else if ('preview' in block) {
		image = block.preview;
	}
	const href = 'externalUrl' in block ? safeUrl(block.externalUrl) : undefined;

	const body = (
		<>
			<div className={cx('uikit-preview__title')}>{title.map((t, i) => parser.renderTextObject(t, i))}</div>
			<div className={cx('uikit-preview__description')}>{description.map((t, i) => parser.renderTextObject(t, i))}</div>
		</>
	);

	return (
		<Block appId={appId} blockId={blockId}>
			<div className={cx('uikit-preview')}>
				{image && safeUrl(image.url) && <img className={cx('uikit-preview__image')} src={image.url} alt='' />}
				<div className={cx('uikit-preview__content')}>
					{href ? (
						<a href={href} target='_blank' rel='noopener noreferrer'>
							{body}
						</a>
					) : (
						body
					)}
					{footer && parser.renderContextBlockElement(footer as never, 0)}
				</div>
			</div>
		</Block>
	);
};
