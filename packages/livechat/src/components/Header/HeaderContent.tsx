import type { ComponentChildren } from 'preact';

import styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';

type HeaderContentProps = {
	children?: ComponentChildren;
	className?: string;
};

const HeaderContent = ({ children, className = undefined, ...props }: HeaderContentProps) => (
	<div className={createClassName(styles, 'header__content', {}, [className])} {...props}>
		{children}
	</div>
);

export default HeaderContent;
