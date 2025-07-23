import type { ComponentChildren } from 'preact';
import { cloneElement, isValidElement, toChildArray } from 'preact';
import { memo } from 'preact/compat';

import * as styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';

export const ButtonGroup = memo(({ children, full = false }: { children: ComponentChildren; full?: boolean }) => (
	<div className={createClassName(styles, 'button-group', { full })}>
		{toChildArray(children).map((child) =>
			isValidElement(child) ? cloneElement(child, { className: createClassName(styles, 'button-group__item') }) : child,
		)}
	</div>
));
