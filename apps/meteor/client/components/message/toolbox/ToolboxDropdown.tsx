import { Box } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactNode, ReactElement } from 'react';
import React, { useRef } from 'react';

import DesktopToolboxDropdown from './DesktopToolboxDropdown';
import MobileToolboxDropdown from './MobileToolboxDropdown';

type ToolboxDropdownProps<R> = {
	children: ReactNode;
	reference: React.RefObject<R>;
};

const ToolboxDropdown = <TReferenceElement extends HTMLElement>({
	children,
	reference,
}: ToolboxDropdownProps<TReferenceElement>): ReactElement => {
	const { isMobile } = useLayout();
	const target = useRef<HTMLButtonElement>(null);

	const Dropdown = isMobile ? MobileToolboxDropdown : DesktopToolboxDropdown;

	return (
		<>
			<Box position='fixed' inset={0} />
			<Dropdown ref={target} reference={reference}>
				{children}
			</Dropdown>
		</>
	);
};

export default ToolboxDropdown;
