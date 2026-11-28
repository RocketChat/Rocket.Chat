import { cx } from '../../helpers/composeClassNames';
import type { ButtonGroupProps } from '../ButtonGroup';
import { ButtonGroup } from '../ButtonGroup';

export type NavBarGroupProps = ButtonGroupProps;

function NavBarGroup({ className, ...props }: NavBarGroupProps) {
	return <ButtonGroup {...props} className={cx('rcx-navbar-group', className)} />;
}

export default NavBarGroup;
