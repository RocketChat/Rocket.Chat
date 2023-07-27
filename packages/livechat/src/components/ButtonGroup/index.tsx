import { cloneElement, toChildArray } from 'preact';
import { memo } from 'preact/compat';

import { createClassName } from '../../helpers/createClassName';
import styles from './styles.scss';

export const ButtonGroup = memo(({ children }) => (
	<div className={createClassName(styles, 'button-group')}>
		{toChildArray(children).map((child) =>
			typeof child === 'object' ? cloneElement(child, { className: createClassName(styles, 'button-group__item') }) : child,
		)}
	</div>
));
