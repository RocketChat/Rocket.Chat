import type { DividerProps } from '../Divider';
import { Divider } from '../Divider';

export type NavBarDividerProps = DividerProps;

// ponytail: `borderColor` stands in for develop's `.rcx-navbar-divider` SCSS rule; NavBar has no CSS file
const NavBarDivider = ({ className, ...props }: NavBarDividerProps) => (
	<Divider
		vertical
		borderColor='medium'
		{...props}
		className={['rcx-navbar-divider', ...(Array.isArray(className) ? className : [className])]}
	/>
);

export default NavBarDivider;
