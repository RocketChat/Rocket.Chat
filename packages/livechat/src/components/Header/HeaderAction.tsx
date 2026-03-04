import type { ComponentChildren } from 'preact';

import styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';

type HeaderActionProps = {
	children?: ComponentChildren;
	className?: string;
	onClick?: () => void;
};

const HeaderAction = ({ children, className = undefined, ...props }: HeaderActionProps) => (
	<button className={createClassName(styles, 'header__action', {}, [className])} {...props}>
		{children}
	</button>
);

export default HeaderAction;
