import { memo } from 'preact/compat';

import { createClassName } from '../../../helpers';
import Block from '../Block';
import styles from './styles.scss';

const DividerBlock = ({ appId, blockId }) => (
	<Block appId={appId} blockId={blockId}>
		<hr className={createClassName(styles, 'uikit-divider-block')} />
	</Block>
);

export default memo(DividerBlock);
