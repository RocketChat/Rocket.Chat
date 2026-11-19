import type { UsePositionOptions } from '@rocket.chat/fuselage-hooks';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import type { HTMLAttributes, ReactNode, RefAttributes, RefObject } from 'react';

import { DropdownDesktopWrapper } from './DropdownDesktopWrapper';
import { DropdownMobile } from './DropdownMobile';

export type DropdownProps<T extends HTMLElement> = Omit<HTMLAttributes<HTMLElement>, 'children' | 'style' | 'color' | 'is'> &
	RefAttributes<HTMLElement> & {
		/** The element the dropdown opens from and is positioned against. */
		reference: RefObject<T | null>;
		/** Where the dropdown sits relative to `reference`. Ignored on narrow screens, where it is a bottom sheet. */
		placement?: UsePositionOptions['placement'];
		children: ReactNode;
	};

/**
 * Floats a panel of choices, usually `Option`s, next to the element that opened it. On screens narrower than 500px it
 * becomes a bottom sheet instead.
 */
function Dropdown({ ref, children, reference, placement = 'bottom-start', ...props }: DropdownProps<HTMLElement>) {
	const notSmall = useMediaQuery('(min-width: 500px)');

	return notSmall ? (
		<DropdownDesktopWrapper reference={reference} placement={placement} ref={ref} {...props}>
			{children}
		</DropdownDesktopWrapper>
	) : (
		<DropdownMobile ref={ref} {...props}>
			{children}
		</DropdownMobile>
	);
}

export default Dropdown;
