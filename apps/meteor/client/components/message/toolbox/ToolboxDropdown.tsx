import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactNode, ReactElement } from 'react';
import React, { useRef } from 'react';

import DesktopToolboxDropdown from './DesktopToolboxDropdown';
import MobileToolboxDropdown from './MobileToolboxDropdown';

const style = css`
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
`;

type ToolboxDropdownProps<R> = {
	children: ReactNode;
	reference: React.RefObject<R>;
	container: Element;
};

const ToolboxDropdown = <R extends HTMLElement>({ children, reference, container, ...props }: ToolboxDropdownProps<R>): ReactElement => {
	const { isMobile } = useLayout();
	const target = useRef<HTMLButtonElement>(null);

	const Dropdown = isMobile ? MobileToolboxDropdown : DesktopToolboxDropdown;

	return (
		<>
			<Box className={style} position='fixed' />
			<Dropdown ref={target} reference={reference} container={container} {...props}>
				{children}
			</Dropdown>
		</>
	);
};

export default ToolboxDropdown;
