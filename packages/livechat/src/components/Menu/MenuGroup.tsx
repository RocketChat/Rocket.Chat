import type { HTMLAttributes } from 'preact/compat';

import styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';

type GroupProps = {
	title?: string;
} & HTMLAttributes<HTMLDivElement>;

const MenuGroup = ({ children, title = '', ...props }: GroupProps) => (
	<div className={createClassName(styles, 'menu__group')} {...props}>
		{title && <div className={createClassName(styles, 'menu__group-title')}>{title}</div>}
		{children}
	</div>
);

export default MenuGroup;
