import type { DividerProps } from '../Divider';
import { Divider } from '../Divider';

export type NavBarDividerProps = DividerProps;

const NavBarDivider = ({ className, ...props }: NavBarDividerProps) => (
	<Divider vertical variation='medium' {...props} className={['rcx-navbar-divider', className].filter(Boolean).join(' ')} />
);

export default NavBarDivider;
