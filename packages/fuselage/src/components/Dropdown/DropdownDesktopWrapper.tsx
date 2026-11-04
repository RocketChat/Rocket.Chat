import type { UsePositionOptions } from '@rocket.chat/fuselage-hooks';
import { usePosition } from '@rocket.chat/fuselage-hooks';
import type { ReactNode, RefAttributes, RefCallback, RefObject } from 'react';
import { useCallback, useRef } from 'react';

import { DropdownDesktop } from './DropdownDesktop';

export type DropdownDesktopWrapperProps<T extends HTMLElement> = RefAttributes<HTMLElement> & {
	reference: RefObject<T | null>;
	placement?: UsePositionOptions['placement'];
	children: ReactNode;
};

export function DropdownDesktopWrapper({ ref, reference, placement = 'bottom-start', ...props }: DropdownDesktopWrapperProps<HTMLElement>) {
	const targetRef = useRef<HTMLElement>(null);

	// Positions against the dropdown node whatever kind of ref the caller passes, and hands the node to that ref
	const mergedRef = useCallback<RefCallback<HTMLElement>>(
		(node) => {
			targetRef.current = node;

			if (typeof ref === 'function') {
				const cleanup = ref(node);
				return () => {
					targetRef.current = null;
					if (typeof cleanup === 'function') {
						cleanup();
						return;
					}
					ref(null);
				};
			}

			if (ref) {
				ref.current = node;
			}

			return () => {
				targetRef.current = null;
				if (ref) {
					ref.current = null;
				}
			};
		},
		[ref],
	);

	const { style } = usePosition(reference, targetRef, {
		placement,
	});

	return <DropdownDesktop style={style} ref={mergedRef} {...props} />;
}
