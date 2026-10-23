import type { DividerProps } from '../Divider';
import { Divider } from '../Divider';

export type NavBarDividerProps = DividerProps;

const NavBarDivider = ({ className, ...props }: NavBarDividerProps) => (
	<Divider vertical {...props} className={['rcx-navbar-divider', ...(Array.isArray(className) ? className : [className])]} />
);

export default NavBarDivider;
