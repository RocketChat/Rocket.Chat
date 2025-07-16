import { NavBarItem } from '@rocket.chat/fuselage';
import type { HTMLAttributes } from 'react';

import { useOmnichannelLivechatToggle } from './hooks/useOmnichannelLivechatToggle';

type NavBarItemOmnichannelLivechatToggleProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarItemOmnichannelLivechatToggle = (props: NavBarItemOmnichannelLivechatToggleProps) => {
	const { handleAvailableStatusChange, title, icon, isSuccess } = useOmnichannelLivechatToggle();

	return (
		<NavBarItem
			{...props}
			id='omnichannel-status-toggle'
			title={title}
			success={isSuccess}
			icon={icon}
			onClick={handleAvailableStatusChange}
		/>
	);
};

export default NavBarItemOmnichannelLivechatToggle;
