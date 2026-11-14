import { ButtonGroup, SidepanelHeader, SidepanelHeaderTitle } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type SidebarPanelHeaderProps = {
	title: string;
	children?: ReactNode;
};

const SidebarPanelHeader = ({ title, children }: SidebarPanelHeaderProps) => (
	<SidepanelHeader>
		<SidepanelHeaderTitle role='heading' aria-level={2}>
			{title}
		</SidepanelHeaderTitle>
		{children && <ButtonGroup>{children}</ButtonGroup>}
	</SidepanelHeader>
);

export default SidebarPanelHeader;
