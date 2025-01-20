import type { IRoom } from '@rocket.chat/core-typings';
import { Box, Margins } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../../../components/GenericModal';
import TeamAutocomplete from '../../../../teams/contextualBar/TeamAutocomplete';

type ChannelToTeamSelectionProps = {
	teamId: IRoom['teamId'];
	onChange: (value: string | string[]) => void;
	onCancel: () => void;
	onConfirm: () => void;
};

const ChannelToTeamSelection = ({ teamId, onCancel, onChange, onConfirm }: ChannelToTeamSelectionProps) => {
	const { t } = useTranslation();

	return (
		<GenericModal
			variant='warning'
			cancelText={t('Cancel')}
			confirmText={t('Continue')}
			title={t('Teams_Select_a_team')}
			onClose={onCancel}
			onCancel={onCancel}
			onConfirm={onConfirm}
			confirmDisabled={!teamId}
		>
			<Margins blockEnd={20}>
				<Box>{t('Teams_move_channel_to_team_description_first')}</Box>
				<Box>{t('Teams_move_channel_to_team_description_second')}</Box>
				<Box>{t('Teams_move_channel_to_team_description_third')}</Box>
				<Box>{t('Teams_move_channel_to_team_description_fourth')}</Box>
			</Margins>

			<Box display='flex' width='100%'>
				<TeamAutocomplete onChange={onChange} value={teamId} />
			</Box>
		</GenericModal>
	);
};

export default ChannelToTeamSelection;
