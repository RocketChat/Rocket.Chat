import type { ComponentChildren } from 'preact';

import styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';

type HeaderPictureProps = {
	children?: ComponentChildren;
	className?: string;
};

export const HeaderPicture = ({ children, className = undefined, ...props }: HeaderPictureProps) => (
	<div className={createClassName(styles, 'header__picture', {}, [className])} {...props}>
		{children}
	</div>
);

export default HeaderPicture;
