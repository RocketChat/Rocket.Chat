import { NavBarItem } from '@rocket.chat/fuselage';
import { useMediaCallTakeOverAction } from '@rocket.chat/ui-voip';
import type { HTMLAttributes } from 'react';

type SidebarRailTakeOverProps = Omit<HTMLAttributes<HTMLElement>, 'is' | 'color'>;

const SidebarRailTakeOver = (props: SidebarRailTakeOverProps) => {
	const takeOverAction = useMediaCallTakeOverAction();

	if (!takeOverAction) {
		return null;
	}

	return <NavBarItem {...props} title={takeOverAction.title} icon={takeOverAction.icon} onClick={takeOverAction.action} />;
};

export default SidebarRailTakeOver;
