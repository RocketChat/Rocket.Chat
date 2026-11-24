import type { UsePositionOptions } from '@rocket.chat/fuselage-hooks';
import { usePosition } from '@rocket.chat/fuselage-hooks';
import type { HTMLAttributes, ReactNode, RefAttributes, RefObject } from 'react';

import { DropdownDesktop } from './DropdownDesktop';

export type DropdownDesktopWrapperProps<T extends HTMLElement> = Omit<HTMLAttributes<HTMLElement>, 'children' | 'style' | 'color'> &
	RefAttributes<HTMLElement> & {
		reference: RefObject<T | null>;
		placement?: UsePositionOptions['placement'];
		children: ReactNode;
	};

export function DropdownDesktopWrapper({ ref, reference, placement = 'bottom-start', ...props }: DropdownDesktopWrapperProps<HTMLElement>) {
	const { style } = usePosition(reference, ref as RefObject<HTMLElement | null>, {
		placement,
	});

	return <DropdownDesktop {...props} style={style} ref={ref} />;
}
