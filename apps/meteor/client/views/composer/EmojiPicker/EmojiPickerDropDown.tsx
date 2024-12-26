import { Dropdown as DropdownMobile } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ForwardedRef, ReactNode, RefObject } from 'react';
import { forwardRef } from 'react';

import EmojiPickerDesktopDropdown from './EmojiPickerDesktopDropdown';

type EmojiPickerDropdownProps<R> = {
	children: ReactNode;
	reference: RefObject<R>;
};

const EmojiPickerDropdown = forwardRef(function EmojiPickerDropdown<TReferenceElement extends HTMLElement>(
	{ children, reference }: EmojiPickerDropdownProps<TReferenceElement>,
	ref: ForwardedRef<HTMLElement>,
) {
	const { isMobile } = useLayout();

	const Dropdown = isMobile ? DropdownMobile : EmojiPickerDesktopDropdown;

	return (
		<Dropdown ref={ref} reference={reference}>
			{children}
		</Dropdown>
	);
});

export default EmojiPickerDropdown;
