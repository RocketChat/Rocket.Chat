import { NavBarGroup, NavBarItem } from '@rocket.chat/fuselage';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useMediaCallAction, useMediaCallTakeOverAction } from '@rocket.chat/ui-voip';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const NavBarVoipGroup = () => {
	const { t } = useTranslation();

	const callAction = useMediaCallAction();
	const takeOverAction = useMediaCallTakeOverAction();
	const router = useRouter();
	const openCallHistory = useCallback(() => {
		router.navigate('/call-history');
	}, [router]);
	if (!callAction) {
		return null;
	}

	return (
		<NavBarGroup aria-label={t('Voice_Call')}>
			{takeOverAction && <NavBarItem title={takeOverAction.title} icon={takeOverAction.icon} onClick={takeOverAction.action} />}
			<NavBarItem title={callAction.title} icon={callAction.icon} onClick={() => callAction.action()} />
			<NavBarItem title={t('Call_history')} icon='clock' onClick={openCallHistory} />
		</NavBarGroup>
	);
};

export default NavBarVoipGroup;
