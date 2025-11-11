import { NavBarGroup, NavBarItem } from '@rocket.chat/fuselage';
import { useMediaCallAction } from '@rocket.chat/ui-voip';
import { useTranslation } from 'react-i18next';

const NavBarVoipGroup = () => {
	const { t } = useTranslation();

	const callAction = useMediaCallAction();
	if (!callAction) {
		return null;
	}

	return (
		<NavBarGroup aria-label={t('Voice_Call')}>
			<NavBarItem title={callAction.title} icon={callAction.icon} onClick={() => callAction.action()} />
		</NavBarGroup>
	);
};

export default NavBarVoipGroup;
