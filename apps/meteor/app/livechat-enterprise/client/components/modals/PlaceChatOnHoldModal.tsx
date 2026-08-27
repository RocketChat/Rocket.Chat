import { GenericModal } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

export type PlaceChatOnHoldModalProps = {
	onOnHoldChat: () => void;
	confirm?: () => void;
	onCancel: () => void;
};

const PlaceChatOnHoldModal = ({ onCancel, onOnHoldChat, confirm = onOnHoldChat }: PlaceChatOnHoldModalProps) => {
	const { t } = useTranslation();

	return (
		<GenericModal
			variant='warning'
			title={t('Omnichannel_onHold_Chat')}
			icon='pause-unfilled'
			confirmText={t('Omnichannel_onHold_Chat')}
			onConfirm={confirm}
			onCancel={onCancel}
			onClose={onCancel}
		>
			{t('Would_you_like_to_place_chat_on_hold')}
		</GenericModal>
	);
};

export default PlaceChatOnHoldModal;
