import { Button, ButtonGroup, Field, Modal } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { QuoteAttachment } from '../../../components/message/content/attachments/QuoteAttachment';
import { useUserDisplayName } from '../../../hooks/useUserDisplayName';
import { IMessage } from '@rocket.chat/core-typings';
import { useTranslation, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { MessageQuoteAttachment } from '@rocket.chat/core-typings';

type PinMessageProps = {
	onConfirm: () => void;
	onCloseModal: () => void;
	message: IMessage;
};

const PinMessageModal = ({ onConfirm, onCloseModal, message }: PinMessageProps): ReactElement => {
	const t = useTranslation();
	const getUserAvatarPath = useUserAvatarPath();
	const displayName = useUserDisplayName(message.u);

	const avatarUrl = getUserAvatarPath(message.u.username);
	const attachment = {
		author_name: String(displayName),
		author_link: '',
		author_icon: avatarUrl,
		message_link: '',
		text: message.msg,
		attachments: message.attachments as MessageQuoteAttachment[],
		md: message.md,
	};
	return (
		<>
			<Modal>
				<Modal.Header>
					<Modal.Title>{t('Are_you_sure_you_want_to_pin_this_message')}</Modal.Title>
					<Modal.Close onClick={onCloseModal} title={t('Close')} />
				</Modal.Header>
				<Modal.Content>
					<Field>
						<QuoteAttachment attachment={attachment} />
					</Field>
				</Modal.Content>
				<Modal.Footer>
					<ButtonGroup>
						<Button onClick={onCloseModal}>{t('Cancel')}</Button>
						<Button onClick={onConfirm} primary>
							{t('Yes_pin_it')}
						</Button>
					</ButtonGroup>
				</Modal.Footer>
			</Modal>
		</>
	);
};

export default PinMessageModal;
