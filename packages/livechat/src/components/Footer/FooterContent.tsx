import type { ComponentChildren } from 'preact';

import styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';

export type FooterContentProps = {
	children: ComponentChildren;
	className?: string;
};

const FooterContent = ({ children, className, ...props }: FooterContentProps) => (
	<div className={createClassName(styles, 'footer__content', {}, [className])} {...props}>
		{children}
	</div>
);

export default FooterContent;
