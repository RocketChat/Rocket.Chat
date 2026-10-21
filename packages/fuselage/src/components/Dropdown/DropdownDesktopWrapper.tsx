import type { UsePositionOptions } from '@rocket.chat/fuselage-hooks';
import { usePosition, useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { ReactNode, RefAttributes, RefObject } from 'react';
import { useRef } from 'react';

import { DropdownDesktop } from './DropdownDesktop';

export type DropdownDesktopWrapperProps<T extends HTMLElement> = RefAttributes<HTMLElement> & {
	reference: RefObject<T | null>;
	placement?: UsePositionOptions['placement'];
	children: ReactNode;
};

export function DropdownDesktopWrapper({ ref, reference, placement = 'bottom-start', ...props }: DropdownDesktopWrapperProps<HTMLElement>) {
	const targetRef = useRef<HTMLElement>(null);
	const mergedRef = useMergedRefs(targetRef, ref);

	const { style } = usePosition(reference, targetRef, {
		placement,
	});

	return <DropdownDesktop style={style} ref={mergedRef} {...props} />;
}
