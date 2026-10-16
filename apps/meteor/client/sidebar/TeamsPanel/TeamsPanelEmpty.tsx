import { Box, Button, ButtonGroup, States, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { usePermission, useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import CreateTeamModal from '../../navbar/NavBarPagesGroup/actions/CreateTeamModal';
import { useCreateRoomModal } from '../../navbar/NavBarPagesGroup/hooks/useCreateRoomModal';

const TeamsPanelEmpty = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const canCreateTeam = usePermission('create-team');
	const createTeam = useCreateRoomModal(CreateTeamModal);

	return (
		<Box display='flex' flexDirection='column' justifyContent='center' flexGrow={1} padding={16}>
			<States>
				<StatesIcon name='team' />
				<StatesTitle>{t('Teams_panel_empty_title')}</StatesTitle>
				<StatesSubtitle>{t('Teams_panel_empty_description')}</StatesSubtitle>
				<ButtonGroup vertical stretch>
					{canCreateTeam && (
						<Button primary small onClick={() => createTeam()}>
							{t('Teams_New_Title')}
						</Button>
					)}
					<Button secondary small onClick={() => router.navigate('/directory/teams')}>
						{t('Browse_teams_in_directory')}
					</Button>
				</ButtonGroup>
			</States>
		</Box>
	);
};

export default TeamsPanelEmpty;
