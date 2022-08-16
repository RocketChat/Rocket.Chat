import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';
import { memo } from 'preact/compat';

import { createClassName } from '../../../helpers';
import Block from '../Block';
import styles from './styles.scss';

const ContextBlock = ({ appId, blockId, elements, parser }) =>
	<Block appId={appId} blockId={blockId}>
		<div className={createClassName(styles, 'uikit-context-block')}>
			{elements.map((element, key) =>
				<div key={key} className={createClassName(styles, 'uikit-context-block__item')}>
					{parser.renderContext(element, BLOCK_CONTEXT.CONTEXT)}
				</div>)}
		</div>
	</Block>;

export default memo(ContextBlock);
