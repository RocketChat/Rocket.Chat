import { NavBarItem } from '@rocket.chat/fuselage';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { useOmnichannelCallToggleAction } from './hooks/useOmnichannelCallToggleAction';

type NavBarItemOmnichannelCallToggleProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarItemOmnichannelCallToggle = (props: NavBarItemOmnichannelCallToggleProps) => {
	const { t } = useTranslation();
	const { icon, title, handleToggleCall, isSuccess, isWarning, isDanger, isDisabled } = useOmnichannelCallToggleAction();

	return (
		<NavBarItem
			{...props}
			icon={icon}
			title={title}
			aria-label={t('VoIP_Toggle')}
			disabled={isDisabled}
			success={isSuccess}
			warning={isWarning}
			danger={isDanger}
			onClick={handleToggleCall}
		/>
	);
};

export default NavBarItemOmnichannelCallToggle;
