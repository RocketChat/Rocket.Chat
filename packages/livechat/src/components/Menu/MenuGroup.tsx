import type { HTMLAttributes } from 'preact/compat';

import styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';

export type MenuGroupProps = {
	title?: string;
} & HTMLAttributes<HTMLDivElement>;

const MenuGroup = ({ children, title = '', ...props }: MenuGroupProps) => (
	<div className={createClassName(styles, 'menu__group')} {...props}>
		{title && <div className={createClassName(styles, 'menu__group-title')}>{title}</div>}
		{children}
	</div>
);

export default MenuGroup;
