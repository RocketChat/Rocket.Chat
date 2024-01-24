import { Box } from '@rocket.chat/fuselage';
import { useOutsideClick } from '@rocket.chat/fuselage-hooks';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactNode, ReactElement } from 'react';
import React, { useRef } from 'react';

import DesktopToolbarDropdown from './DesktopToolbarDropdown';
import MobileToolbarDropdown from './MobileToolbarDropdown';

type ToolbarDropdownProps<R> = {
	children: ReactNode;
	reference: React.RefObject<R>;
	handleClose: () => void;
};

const ToolbarDropdown = <TReferenceElement extends HTMLElement>({
	children,
	handleClose,
	reference,
}: ToolbarDropdownProps<TReferenceElement>): ReactElement => {
	const { isMobile } = useLayout();
	const target = useRef<HTMLButtonElement>(null);
	const boxRef = useRef<HTMLDivElement>(null);

	const Dropdown = isMobile ? MobileToolbarDropdown : DesktopToolbarDropdown;

	useOutsideClick([boxRef], handleClose);

	return (
		<Dropdown ref={target} reference={reference}>
			<Box w='full' h='full' ref={boxRef}>
				{children}
			</Box>
		</Dropdown>
	);
};

export default ToolbarDropdown;
