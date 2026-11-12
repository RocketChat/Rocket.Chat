import { Box, ButtonGroup, SidepanelHeader, SidepanelHeaderTitle } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type SidebarPanelHeaderProps = {
	title: string;
	children?: ReactNode;
};

const SidebarPanelHeader = ({ title, children }: SidebarPanelHeaderProps) => (
	<Box borderBlockEndWidth='default' borderBlockEndStyle='solid' borderBlockEndColor='stroke-extra-light' flexShrink={0}>
		<SidepanelHeader>
			<SidepanelHeaderTitle role='heading' aria-level={2}>
				{title}
			</SidepanelHeaderTitle>
			{children && <ButtonGroup>{children}</ButtonGroup>}
		</SidepanelHeader>
	</Box>
);

export default SidebarPanelHeader;
