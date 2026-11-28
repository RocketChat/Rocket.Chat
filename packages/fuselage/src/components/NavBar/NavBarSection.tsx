import type { HTMLAttributes } from 'react';
import { Fragment } from 'react';
import { isElement } from 'react-is';
import flattenChildren from 'react-keyed-flatten-children';

import NavBarDivider from './NavBarDivider';
import { cx } from '../../helpers/composeClassNames';

export type NavbarSectionProps = HTMLAttributes<HTMLSpanElement>;

const NavBarSection = ({ children, className, ...props }: NavbarSectionProps) => {
	const groups = flattenChildren(children).filter(isElement);

	return (
		<span {...props} className={cx('rcx-navbar-section', className)}>
			{groups.map((child, index) => (
				<Fragment key={index}>
					{child}
					{index < groups.length - 1 && <NavBarDivider />}
				</Fragment>
			))}
		</span>
	);
};

export default NavBarSection;
