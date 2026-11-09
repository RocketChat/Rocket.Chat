import { cx } from '../../helpers/composeClassNames.js';
import type { ButtonGroupProps } from '../ButtonGroup/index.js';
import { ButtonGroup } from '../ButtonGroup/index.js';

export type NavBarGroupProps = ButtonGroupProps;

function NavBarGroup({ className, ...props }: NavBarGroupProps) {
	return <ButtonGroup {...props} className={cx('rcx-navbar-group', className)} />;
}

export default NavBarGroup;
