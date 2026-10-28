import type { UsePositionOptions } from '@rocket.chat/fuselage-hooks';
import { usePosition } from '@rocket.chat/fuselage-hooks';
import type { ReactNode, RefAttributes, RefObject } from 'react';

import { DropdownDesktop } from './DropdownDesktop';

export type DropdownDesktopWrapperProps<T extends HTMLElement> = RefAttributes<HTMLElement> & {
	reference: RefObject<T | null>;
	placement?: UsePositionOptions['placement'];
	children: ReactNode;
};

export function DropdownDesktopWrapper({ ref, reference, placement = 'bottom-start', ...props }: DropdownDesktopWrapperProps<HTMLElement>) {
	const { style } = usePosition(reference, ref as RefObject<HTMLElement | null>, {
		placement,
	});

	return <DropdownDesktop style={style} ref={ref} {...props} />;
}
