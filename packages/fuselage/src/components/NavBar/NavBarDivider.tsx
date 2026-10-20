import type { DividerProps } from '../Divider';
import { Divider } from '../Divider';

export type NavBarDividerProps = DividerProps;

const NavBarDivider = (props: NavBarDividerProps) => <Divider rcx-navbar-divider vertical borderColor='medium' {...props} />;

export default NavBarDivider;
