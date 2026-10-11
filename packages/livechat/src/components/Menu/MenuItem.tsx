import type { ComponentChildren } from 'preact';
import type { HTMLAttributes } from 'preact/compat';

import styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';

type ItemProps = {
	primary?: boolean;
	danger?: boolean;
	disabled?: boolean;
	icon?: () => ComponentChildren;
} & HTMLAttributes<HTMLButtonElement>;

const MenuItem = ({ children, primary = false, danger = false, disabled = false, icon = undefined, ...props }: ItemProps) => (
	<button className={createClassName(styles, 'menu__item', { primary, danger, disabled })} disabled={disabled} {...props}>
		{icon && <div className={createClassName(styles, 'menu__item__icon')}>{icon()}</div>}
		{children}
	</button>
);

export default MenuItem;
