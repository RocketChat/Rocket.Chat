import type { ComponentChildren } from 'preact';

import styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';

export type FooterProps = {
	children: ComponentChildren;
	className?: string;
};

const Footer = ({ children, className, ...props }: FooterProps) => (
	<footer className={createClassName(styles, 'footer', {}, [className])} {...props}>
		{children}
	</footer>
);

export default Footer;
