import { Box, Tile } from '@rocket.chat/fuselage';
import { useMergedRefs, usePosition } from '@rocket.chat/fuselage-hooks';
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

const useDropdownPosition = (reference: RefObject<HTMLElement>, target: RefObject<HTMLElement>) => {
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

	const { style } = usePosition(reference, target, {
		placement,
		container: innerContainer,
	});

	return useMemo(() => {
		return { ...style, maxHeight };
	}, [style]);
};

type EmojiPickerDesktopDropdownProps = {
	children: ReactNode;
	reference: RefObject<HTMLElement>;
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

	return (
		<Tile style={style} ref={mergedRef} elevation='2' pi='0' pb='0' display='flex' flexDirection='column' overflow='auto'>
			<Box flexShrink={1} pb={12}>
				{children}
			</Box>
		</Tile>
	);
});

export default EmojiPickerDesktopDropdown;
