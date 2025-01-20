import { Button, Modal } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

type PlaceChatOnHoldModalProps = {
	onOnHoldChat: () => void;
	confirm?: () => void;
	onCancel: () => void;
};

const PlaceChatOnHoldModal = ({ onCancel, onOnHoldChat, confirm = onOnHoldChat, ...props }: PlaceChatOnHoldModalProps) => {
	const { t } = useTranslation();

	return (
		<Modal {...props} data-qa-id='on-hold-modal'>
			<Modal.Header>
				<Modal.Icon name='pause-unfilled' />
				<Modal.Title>{t('Omnichannel_onHold_Chat')}</Modal.Title>
				<Modal.Close onClick={onCancel} />
			</Modal.Header>
			<Modal.Content fontScale='p2'>{t('Would_you_like_to_place_chat_on_hold')}</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onCancel}>{t('Cancel')}</Button>
					<Button primary onClick={confirm}>
						{t('Omnichannel_onHold_Chat')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default PlaceChatOnHoldModal;
