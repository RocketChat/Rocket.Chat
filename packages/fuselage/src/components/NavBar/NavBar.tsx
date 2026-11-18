import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type NavBarProps = HTMLAttributes<HTMLElement>;

/**
 * The bar across the top of the app that holds its main destinations and actions, in `NavBarSection`s pushed to either
 * end.
 */
const NavBar = ({ className, ...props }: NavBarProps) => <nav {...props} className={cx('rcx-navbar', className)} />;

export default NavBar;
