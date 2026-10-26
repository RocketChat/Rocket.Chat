import type { UsePositionOptions } from '@rocket.chat/fuselage-hooks';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import type { HTMLAttributes, ReactNode, RefAttributes, RefObject } from 'react';

import { DropdownDesktopWrapper } from './DropdownDesktopWrapper';
import { DropdownMobile } from './DropdownMobile';

export type DropdownProps<T extends HTMLElement> = Omit<HTMLAttributes<HTMLElement>, 'children' | 'style' | 'color'> &
	RefAttributes<HTMLElement> & {
		reference: RefObject<T | null>;
		placement?: UsePositionOptions['placement'];
		children: ReactNode;
	};

function Dropdown({ ref, children, reference, placement = 'bottom-start', ...props }: DropdownProps<HTMLElement>) {
	const notSmall = useMediaQuery('(min-width: 500px)');

	return notSmall ? (
		<DropdownDesktopWrapper reference={reference} placement={placement} ref={ref} {...props}>
			{children}
		</DropdownDesktopWrapper>
	) : (
		<DropdownMobile ref={ref} {...props}>{children}</DropdownMobile>
	);
}

export default Dropdown;
