import type * as uikit from '@rocket.chat/ui-kit';
import { memo } from 'preact/compat';

import { createClassName } from '../../../../helpers/createClassName';
import Block from '../Block';
import styles from './styles.scss';

type DividerBlockProps = uikit.DividerBlock;

const DividerBlock = ({ appId, blockId }: DividerBlockProps) => (
	<Block appId={appId} blockId={blockId}>
		<hr className={createClassName(styles, 'uikit-divider-block')} />
	</Block>
);

export default memo(DividerBlock);
