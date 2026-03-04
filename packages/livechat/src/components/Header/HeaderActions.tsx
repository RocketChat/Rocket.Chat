import type { ComponentChildren } from 'preact';

import styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';

type HeaderActionsProps = {
	children?: ComponentChildren;
	className?: string;
};

const HeaderActions = ({ children, className = undefined, ...props }: HeaderActionsProps) => (
	<nav className={createClassName(styles, 'header__actions', {}, [className])} {...props}>
		{children}
	</nav>
);

export default HeaderActions;
