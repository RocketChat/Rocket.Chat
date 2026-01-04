import {
	Button,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
	ModalHeader,
	ModalIcon,
	ModalTitle,
} from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

type PlaceChatOnHoldModalProps = {
	onOnHoldChat: () => void;
	confirm?: () => void;
	onCancel: () => void;
};

const PlaceChatOnHoldModal = ({ onCancel, onOnHoldChat, confirm = onOnHoldChat, ...props }: PlaceChatOnHoldModalProps) => {
	const { t } = useTranslation();

	return (
		// TODO: Replace Modal with GenericModal
		<Modal {...props} aria-label={t('Omnichannel_onHold_Chat')}>
			<ModalHeader>
				<ModalIcon name='pause-unfilled' />
				<ModalTitle>{t('Omnichannel_onHold_Chat')}</ModalTitle>
				<ModalClose onClick={onCancel} />
			</ModalHeader>
			<ModalContent fontScale='p2'>{t('Would_you_like_to_place_chat_on_hold')}</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button onClick={onCancel}>{t('Cancel')}</Button>
					<Button primary onClick={confirm}>
						{t('Omnichannel_onHold_Chat')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default PlaceChatOnHoldModal;
