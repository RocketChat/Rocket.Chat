import { Box, States, StatesAction, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { usePermission, useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import CreateTeamModal from '../../navbar/NavBarPagesGroup/actions/CreateTeamModalWithData';
import { useCreateRoomModal } from '../../navbar/NavBarPagesGroup/hooks/useCreateRoomModal';

const TeamsPanelEmpty = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const canCreateTeam = usePermission('create-team');
	const createTeam = useCreateRoomModal(CreateTeamModal);

	return (
		<Box display='flex' height='100%' flexDirection='column' justifyContent='center'>
			<States>
				<StatesIcon name='team' />
				<StatesTitle>{t('Teams_panel_empty_title')}</StatesTitle>
				<StatesSubtitle>{t('Teams_panel_empty_description')}</StatesSubtitle>
				<StatesActions vertical>
					{canCreateTeam && <StatesAction onClick={createTeam}>{t('Teams_New_Title')}</StatesAction>}
					<StatesAction variant='secondary' onClick={() => router.navigate('/directory/teams')}>
						{t('Browse_teams_in_directory')}
					</StatesAction>
				</StatesActions>
			</States>
		</Box>
	);
};

export default TeamsPanelEmpty;
