import type { ComponentChildren } from 'preact';

import styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';

type HeaderTitleProps = {
	children?: ComponentChildren;
	className?: string;
};

const HeaderTitle = ({ children, className = undefined, ...props }: HeaderTitleProps) => (
	<div className={createClassName(styles, 'header__title', {}, [className])} data-qa='header-title' {...props}>
		{children}
	</div>
);

export default HeaderTitle;
