import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import React, { ReactNode, useRef, ReactElement } from 'react';

import { ToolboxDropdownDesktop } from './ToolboxDropdownDesktop';
import { ToolboxDropdownMobile } from './ToolboxDropdownMobile';

const style = css`
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
`;
export const ToolboxDropdown = <R extends HTMLElement>({
	reference,
	children,
	...rest
}: {
	reference: React.RefObject<R>;
	children: ReactNode;
}): ReactElement => {
	const { isMobile } = useLayout();
	const target = useRef<HTMLButtonElement>(null);

	const DropdownTemplate = isMobile ? ToolboxDropdownMobile : ToolboxDropdownDesktop;
	return (
		<>
			<Box className={style} position='fixed' />
			<DropdownTemplate ref={target} reference={reference} {...rest}>
				{children}
			</DropdownTemplate>
		</>
	);
};
