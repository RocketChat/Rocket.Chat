import { Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { Trans, useTranslation } from 'react-i18next';

type ABACDeleteRoomModalProps = {
	onClose: () => void;
	roomName: string;
	onConfirm: () => void;
};
const ABACDeleteRoomModal = ({ onClose, onConfirm, roomName }: ABACDeleteRoomModalProps) => {
	const { t } = useTranslation();
	return (
		<GenericModal
			variant='danger'
			icon={null}
			title={t('ABAC_Delete_room')}
			annotation={t('ABAC_Delete_room_annotation')}
			confirmText={t('Remove')}
			onConfirm={onConfirm}
			onCancel={onClose}
		>
			<Trans i18nKey='ABAC_Delete_room_content' values={{ roomName }} components={{ bold: <Box is='span' fontWeight='bold' /> }} />
		</GenericModal>
	);
};

export default ABACDeleteRoomModal;
