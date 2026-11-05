import type { ButtonGroupProps } from '../ButtonGroup';
import { ButtonGroup } from '../ButtonGroup';

export type NavBarGroupProps = ButtonGroupProps;

function NavBarGroup(props: NavBarGroupProps) {
	return <ButtonGroup className='rcx-navbar-group' {...props} />;
}

export default NavBarGroup;
