import { Box } from '@rocket.chat/fuselage';
import { useOutsideClick } from '@rocket.chat/fuselage-hooks';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactNode, ReactElement } from 'react';
import React, { useRef } from 'react';

import DesktopToolboxDropdown from './DesktopToolboxDropdown';
import MobileToolboxDropdown from './MobileToolboxDropdown';

type ToolboxDropdownProps<R> = {
	children: ReactNode;
	reference: React.RefObject<R>;
	handleClose: () => void;
};

const ToolboxDropdown = <TReferenceElement extends HTMLElement>({
	children,
	handleClose,
	reference,
}: ToolboxDropdownProps<TReferenceElement>): ReactElement => {
	const { isMobile } = useLayout();
	const target = useRef<HTMLButtonElement>(null);
	const boxRef = useRef<HTMLDivElement>(null);

	const Dropdown = isMobile ? MobileToolboxDropdown : DesktopToolboxDropdown;

	useOutsideClick([boxRef], handleClose);

	return (
		<Dropdown ref={target} reference={reference}>
			<Box w='full' h='full' ref={boxRef}>
				{children}
			</Box>
		</Dropdown>
	);
};

export default ToolboxDropdown;
