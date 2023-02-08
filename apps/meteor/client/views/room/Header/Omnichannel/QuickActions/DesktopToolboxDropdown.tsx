import { Dropdown } from '@rocket.chat/fuselage';
import type { ReactNode, Ref, RefObject } from 'react';
import React, { forwardRef } from 'react';

type DesktopToolboxDropdownProps = {
	children: ReactNode;
	reference: RefObject<HTMLElement>;
};

const DesktopToolboxDropdown = forwardRef(function ToolboxDropdownDesktop(
	{ reference, children }: DesktopToolboxDropdownProps,
	ref: Ref<HTMLElement>,
) {
	return (
		<Dropdown ref={ref} reference={reference}>
			{children}
		</Dropdown>
	);
});

export default DesktopToolboxDropdown;
