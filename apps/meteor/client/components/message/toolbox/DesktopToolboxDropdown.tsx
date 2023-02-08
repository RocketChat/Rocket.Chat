import { Tile } from '@rocket.chat/fuselage';
import { useMergedRefs, usePosition } from '@rocket.chat/fuselage-hooks';
import type { ReactNode, Ref, RefObject } from 'react';
import React, { useMemo, useRef, forwardRef } from 'react';

const getDropdownContainer = (descendant: HTMLElement | null) => {
	for (let element = descendant ?? document.body; element !== document.body; element = element.parentElement ?? document.body) {
		if (
			getComputedStyle(element).transform !== 'none' ||
			getComputedStyle(element).position === 'fixed' ||
			getComputedStyle(element).willChange === 'transform'
		) {
			return element;
		}
	}

	return document.body;
};

const useDropdownPosition = (reference: RefObject<HTMLElement>, target: RefObject<HTMLElement>) => {
	const innerContainer = getDropdownContainer(reference.current);
	const boundingRect = innerContainer.getBoundingClientRect();

	const { style } = usePosition(reference, target, {
		watch: true,
		placement: 'bottom-end',
		container: innerContainer,
	});

	const left = `${parseFloat(style.left) - boundingRect.left}px`;
	const top = `${parseFloat(style.top) - boundingRect.top}px`;

	return useMemo(() => ({ ...style, left, top }), [style, left, top]);
};

type DesktopToolboxDropdownProps = {
	children: ReactNode;
	reference: RefObject<HTMLElement>;
};

const DesktopToolboxDropdown = forwardRef(function ToolboxDropdownDesktop(
	{ reference, children }: DesktopToolboxDropdownProps,
	ref: Ref<HTMLElement>,
) {
	const targetRef = useRef<HTMLElement>(null);
	const mergedRef = useMergedRefs(ref, targetRef);

	const style = useDropdownPosition(reference, targetRef);

	return (
		<Tile is='ul' padding={0} paddingBlock={12} paddingInline={0} elevation='2' ref={mergedRef} style={style}>
			{children}
		</Tile>
	);
});

export default DesktopToolboxDropdown;
