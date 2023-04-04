import { cloneElement, toChildArray } from 'preact';

import { createClassName, memo } from '../helpers';
import styles from './styles.scss';

export const ButtonGroup = memo(({ children }) => (
	<div className={createClassName(styles, 'button-group')}>
		{toChildArray(children).map((child) => cloneElement(child, { className: createClassName(styles, 'button-group__item') }))}
	</div>
));
