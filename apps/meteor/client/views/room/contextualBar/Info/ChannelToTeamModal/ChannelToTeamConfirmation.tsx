import type { IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import AbacAttributesLostWarning from '../../../../../components/ABAC/AbacAttributesLostWarning';

export type ChannelToTeamConfirmationProps = {
	onCancel: () => void;
	onConfirm: () => void;
	/** The channel being moved — moving it into a team discards its ABAC attributes. */
	room?: Pick<IRoom, 'abacAttributes'>;
};

const ChannelToTeamConfirmation = ({ onCancel, onConfirm, room }: ChannelToTeamConfirmationProps) => {
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
			{room && <AbacAttributesLostWarning room={room} />}
		</GenericModal>
	);
};

export default ChannelToTeamConfirmation;
