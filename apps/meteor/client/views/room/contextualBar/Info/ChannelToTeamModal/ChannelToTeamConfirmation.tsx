import { Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import AbacAttributesRemovalWarning from '../../../../../components/ABAC/AbacAttributesRemovalWarning';

export type ChannelToTeamConfirmationProps = {
	onCancel: () => void;
	onConfirm: () => void;
	removesAbacAttributes?: boolean;
};

const ChannelToTeamConfirmation = ({ onCancel, onConfirm, removesAbacAttributes }: ChannelToTeamConfirmationProps) => {
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
			{removesAbacAttributes && <AbacAttributesRemovalWarning />}
		</GenericModal>
	);
};

export default ChannelToTeamConfirmation;
