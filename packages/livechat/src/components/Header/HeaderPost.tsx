import type { ComponentChildren } from 'preact';

import styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';

type HeaderPostProps = {
	children?: ComponentChildren;
	className?: string;
};

export const HeaderPost = ({ children, className = undefined, ...props }: HeaderPostProps) => (
	<div className={createClassName(styles, 'header__post', {}, [className])} {...props}>
		{children}
	</div>
);

export default HeaderPost;
