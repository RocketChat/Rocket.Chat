import { Dropdown as DropdownMobile } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactNode, Ref, RefObject } from 'react';

import EmojiPickerDesktopDropdown from './EmojiPickerDesktopDropdown';

type EmojiPickerDropdownProps<R> = {
	children: ReactNode;
	reference: RefObject<R | null>;
	ref?: Ref<HTMLElement>;
};

const EmojiPickerDropdown = <TReferenceElement extends HTMLElement>({
	children,
	reference,
	ref,
}: EmojiPickerDropdownProps<TReferenceElement>) => {
	const { isMobile } = useLayout();

	const Dropdown = isMobile ? DropdownMobile : EmojiPickerDesktopDropdown;

	return (
		<Dropdown ref={ref} reference={reference}>
			{children}
		</Dropdown>
	);
};

export default EmojiPickerDropdown;
