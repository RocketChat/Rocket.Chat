import { Tile } from '@rocket.chat/fuselage';
import { useMergedRefs, usePosition } from '@rocket.chat/fuselage-hooks';
import type { ReactNode, Ref, RefObject } from 'react';
import React, { useRef, forwardRef } from 'react';

type DesktopToolboxDropdownProps = {
	children: ReactNode;
	reference: RefObject<HTMLElement>;
	container: Element;
};

const DesktopToolboxDropdown = forwardRef(function ToolboxDropdownDesktop(
	{ reference, container, children, ...props }: DesktopToolboxDropdownProps,
	ref: Ref<HTMLElement>,
) {
	const targetRef = useRef<HTMLElement>(null);
	const mergedRef = useMergedRefs(ref, targetRef);

	const { style } = usePosition(reference, targetRef, {
		watch: true,
		placement: 'bottom-end',
		container,
	});

	return (
		<Tile is='ul' padding={0} paddingBlock={12} paddingInline={0} elevation='2' ref={mergedRef} style={style} {...props}>
			{children}
		</Tile>
	);
});

export default DesktopToolboxDropdown;
