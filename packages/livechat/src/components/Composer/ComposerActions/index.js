import { memo } from 'preact/compat';

import { createClassName } from '../../../helpers/createClassName';
import styles from './styles.scss';

export const ComposerActions = memo(({ className, style = {}, children }) => (
	<div className={createClassName(styles, 'composer__actions', {}, [className])} style={style}>
		{children}
	</div>
));
