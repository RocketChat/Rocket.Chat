import type * as uikit from '@rocket.chat/ui-kit';
import { BlockContext } from '@rocket.chat/ui-kit';
import type { ComponentChild } from 'preact';
import { memo } from 'preact/compat';

import { createClassName } from '../../../../helpers/createClassName';
import Block from '../Block';
import styles from './styles.scss';

type ContextBlockProps = uikit.ContextBlock & {
	parser: uikit.SurfaceRenderer<ComponentChild>;
};

const ContextBlock = ({ appId, blockId, elements, parser }: ContextBlockProps) => (
	<Block appId={appId} blockId={blockId}>
		<div className={createClassName(styles, 'uikit-context-block')}>
			{elements.map((element, key) => (
				<div key={key} className={createClassName(styles, 'uikit-context-block__item')}>
					{parser.renderContext(element, BlockContext.CONTEXT, undefined, key)}
				</div>
			))}
		</div>
	</Block>
);

export default memo(ContextBlock);
