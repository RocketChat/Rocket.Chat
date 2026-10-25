import { Box, PopoverSurface } from '@rocket.chat/fuselage';
import { useMergedRefs, usePosition, usePreventScrollOutside } from '@rocket.chat/fuselage-hooks';
import type { ReactNode, Ref, RefObject } from 'react';
import { useMemo, useRef, forwardRef } from 'react';

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

const useDropdownPosition = (reference: RefObject<HTMLElement | null>, target: RefObject<HTMLElement | null>) => {
	const innerContainer = getDropdownContainer(reference.current);
	const viewHeight = document.body.getBoundingClientRect().height;
	const refTop = reference.current?.getBoundingClientRect().top ?? 0;
	const targetHeight = target.current?.getBoundingClientRect().height || 0;

	const placement = useMemo(() => {
		if (refTop >= viewHeight / 2) {
			return 'top-start';
		}
		return 'bottom-end';
	}, [targetHeight, refTop]);

	const maxHeight = useMemo(() => (placement === 'bottom-end' ? '482px' : `${refTop - 12}px`), [placement, refTop]);

	const { style } = usePosition(reference as RefObject<HTMLElement>, target as RefObject<HTMLElement>, {
		placement,
		container: innerContainer,
	});

	return useMemo(() => {
		return { ...style, maxHeight };
	}, [style]);
};

export type EmojiPickerDesktopDropdownProps = {
	children: ReactNode;
	reference: RefObject<HTMLElement | null>;
};

/**
 * @reference is the trigger element target
 * @ref is the dropdown element target
 *  */
const EmojiPickerDesktopDropdown = forwardRef(function ToolboxDropdownDesktop(
	{ reference, children }: EmojiPickerDesktopDropdownProps,
	ref: Ref<HTMLElement>,
) {
	const targetRef = useRef<HTMLElement>(null);
	const mergedRef = useMergedRefs(ref, targetRef);

	const style = useDropdownPosition(reference, targetRef);
	// The picker belongs to the message it was opened from, and scrolling the page would leave it beside another one.
	usePreventScrollOutside(targetRef);

	return (
		<PopoverSurface style={style} ref={mergedRef}>
			<Box>{children}</Box>
		</PopoverSurface>
	);
});

export default EmojiPickerDesktopDropdown;
