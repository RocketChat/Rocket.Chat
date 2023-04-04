import { BlockContext } from '@rocket.chat/ui-kit';
import { memo } from 'preact/compat';

import { createClassName } from '../../../helpers';
import Block from '../Block';
import styles from './styles.scss';

const SectionBlock = ({ appId, blockId, text, fields, accessory, parser }) => (
	<Block appId={appId} blockId={blockId}>
		<div className={createClassName(styles, 'uikit-section-block')}>
			<div className={createClassName(styles, 'uikit-section-block__content')}>
				{text && <div className={createClassName(styles, 'uikit-section-block__text')}>{parser.text(text, BlockContext.SECTION)}</div>}
				{Array.isArray(fields) && fields.length > 0 && (
					<div className={createClassName(styles, 'uikit-section-block__fields')}>
						{fields.map((field, i) => (
							<div key={i} className={createClassName(styles, 'uikit-section-block__field')}>
								{parser.text(field, BlockContext.SECTION)}
							</div>
						))}
					</div>
				)}
			</div>
			{accessory && (
				<div className={createClassName(styles, 'uikit-section-block__accessory')}>
					{parser.renderAccessories(accessory, BlockContext.SECTION)}
				</div>
			)}
		</div>
	</Block>
);

export default memo(SectionBlock);
