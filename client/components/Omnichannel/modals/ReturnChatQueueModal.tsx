import { Box, Button, ButtonGroup, Icon, Modal } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import { withDoNotAskAgain, RequiredModalProps } from '../../withDoNotAskAgain';

type ReturnChatQueueModalProps = RequiredModalProps & {
	onMoveChat: () => void;
	onCancel: () => void;
};

const ReturnChatQueueModal: FC<ReturnChatQueueModalProps> = ({
	onCancel,
	onMoveChat,
	confirm = onMoveChat,
	dontAskAgain,
	...props
}) => {
	const t = useTranslation();

	return (
		<Modal {...props}>
			<Modal.Header>
				<Icon name='burger-arrow-left' size={20} />
				<Modal.Title>{t('Return_to_the_queue')}</Modal.Title>
				<Modal.Close onClick={onCancel} />
			</Modal.Header>
			<Modal.Content fontScale='p1'>{t('Would_you_like_to_return_the_queue')}</Modal.Content>
			<Modal.Footer>
				<Box>
					{dontAskAgain}
					<ButtonGroup align='end'>
						<Button onClick={onCancel}>{t('Cancel')}</Button>
						<Button primary onClick={confirm}>
							{t('Move_queue')}
						</Button>
					</ButtonGroup>
				</Box>
			</Modal.Footer>
		</Modal>
	);
};

export const ReturnChatQueueDoNotAskAgain = withDoNotAskAgain<ReturnChatQueueModalProps>(
	ReturnChatQueueModal,
);

export default ReturnChatQueueModal;
