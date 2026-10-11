import type { HTMLAttributes } from 'preact/compat';

import styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';

export type MenuProps = {
	hidden?: boolean;
	placement?: string;
	ref?: any; // FIXME: remove this
} & Omit<HTMLAttributes<HTMLDivElement>, 'ref'>;

const Menu = ({ children, hidden, placement = '', ...props }: MenuProps) => (
	<div className={createClassName(styles, 'menu', { hidden, placement })} {...props}>
		{children}
	</div>
);

export default Menu;
