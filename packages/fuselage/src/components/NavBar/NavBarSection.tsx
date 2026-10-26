import { styled, View, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';
import { Fragment } from 'react';
import { isElement } from 'react-is';
import flattenChildren from 'react-keyed-flatten-children';

import NavBarDivider from './NavBarDivider';
import { prependClassName } from '../../helpers/prependClassName';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const NavBarSectionFrame = styled(View, {
	render: 'span',
	boxSizing: 'content-box',
	minWidth: 'auto',
	minHeight: 'auto',
	flexDirection: 'row',
	flexShrink: 1,
	alignItems: 'center',
});

export type NavbarSectionProps = HTMLAttributes<HTMLSpanElement>;

const NavBarSection = ({ children, className, ...props }: NavbarSectionProps) => {
	const groups = flattenChildren(children).filter(isElement);

	return (
		<NavBarSectionFrame className={prependClassName(className, 'rcx-navbar-section')} {...(props as GetProps<typeof NavBarSectionFrame>)}>
			{groups.map((child, index) => (
				<Fragment key={index}>
					{child}
					{index < groups.length - 1 && <NavBarDivider />}
				</Fragment>
			))}
		</NavBarSectionFrame>
	);
};

export default withFuselageProvider(NavBarSection);
