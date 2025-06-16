import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../../../components/GenericModal';

type ChannelToTeamConfirmationProps = {
	onCancel: () => void;
	onConfirm: () => void;
};

const ChannelToTeamConfirmation = ({ onCancel, onConfirm }: ChannelToTeamConfirmationProps) => {
	const { t } = useTranslation();

	return (
		<GenericModal
			variant='warning'
			icon='warning'
			title={t('Confirmation')}
			confirmText={t('Yes')}
			onClose={onCancel}
			onCancel={onCancel}
			onConfirm={onConfirm}
		>
			<Box>{t('Teams_move_channel_to_team_confirm_description')}</Box>
		</GenericModal>
	);
};

export default ChannelToTeamConfirmation;
