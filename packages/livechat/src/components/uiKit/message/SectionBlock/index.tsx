import * as uikit from '@rocket.chat/ui-kit';
import type { ComponentChild } from 'preact';
import { memo } from 'preact/compat';

import { createClassName } from '../../../../helpers/createClassName';
import Block from '../Block';
import styles from './styles.scss';

type SectionBlockProps = uikit.SectionBlock & {
	parser: uikit.SurfaceRenderer<ComponentChild>;
};

const SectionBlock = ({ appId, blockId, text, fields, accessory, parser }: SectionBlockProps) => (
	<Block appId={appId} blockId={blockId}>
		<div className={createClassName(styles, 'uikit-section-block')}>
			<div className={createClassName(styles, 'uikit-section-block__content')}>
				{text && (
					<div className={createClassName(styles, 'uikit-section-block__text')}>{parser.text(text, uikit.BlockContext.SECTION)}</div>
				)}
				{Array.isArray(fields) && fields.length > 0 && (
					<div className={createClassName(styles, 'uikit-section-block__fields')}>
						{fields.map((field, i) => (
							<div key={i} className={createClassName(styles, 'uikit-section-block__field')}>
								{parser.text(field, uikit.BlockContext.SECTION)}
							</div>
						))}
					</div>
				)}
			</div>
			{accessory && (
				<div className={createClassName(styles, 'uikit-section-block__accessory')}>
					{parser.renderAccessories(accessory, uikit.BlockContext.SECTION, undefined, 0)}
				</div>
			)}
		</div>
	</Block>
);

export default memo(SectionBlock);
