import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames.js';

export type NavBarProps = HTMLAttributes<HTMLElement>;

const NavBar = ({ className, ...props }: NavBarProps) => <nav {...props} className={cx('rcx-navbar', className)} />;

export default NavBar;
