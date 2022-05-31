import { Box, Button, ButtonGroup, Icon, Modal } from '@rocket.chat/fuselage';
import React, { FC } from 'react';
import { useTranslation } from '@rocket.chat/ui-contexts';

type PlaceChatOnHoldModalProps = {
	onOnHoldChat: () => void;
	confirm?: () => void;
	onCancel: () => void;
};

const PlaceChatOnHoldModal: FC<PlaceChatOnHoldModalProps> = ({ onCancel, onOnHoldChat, confirm = onOnHoldChat, ...props }) => {
	const t = useTranslation();

	return (
		<Modal {...props}>
			<Modal.Header>
				<Icon name='pause-unfilled' size={20} />
				<Modal.Title>{t('Omnichannel_onHold_Chat')}</Modal.Title>
				<Modal.Close onClick={onCancel} />
			</Modal.Header>
			<Modal.Content fontScale='p2'>{t('Would_you_like_to_place_chat_on_hold')}</Modal.Content>
			<Modal.Footer>
				<Box>
					<ButtonGroup align='end'>
						<Button onClick={onCancel}>{t('Cancel')}</Button>
						<Button primary onClick={confirm}>
							{t('Omnichannel_onHold_Chat')}
						</Button>
					</ButtonGroup>
				</Box>
			</Modal.Footer>
		</Modal>
	);
};

export default PlaceChatOnHoldModal;
