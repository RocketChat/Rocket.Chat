import type { IMessage } from '@rocket.chat/core-typings';

import { settings } from '../../../../app/settings/client';
import { messageProperties } from '../../../../app/ui-utils/client';
import { t } from '../../../../app/utils/client';
import GenericModal from '../../../components/GenericModal';
import { imperativeModal } from '../../imperativeModal';
import { dispatchToastMessage } from '../../toast';
import type { ChatAPI } from '../ChatAPI';

export const processTooLongMessage = async (chat: ChatAPI, { msg }: Pick<IMessage, 'msg'>): Promise<boolean> => {
	const adjustedMessage = messageProperties.messageWithoutEmojiShortnames(msg);
	const maxAllowedSize = settings.get('Message_MaxAllowedSize');

	if (messageProperties.length(adjustedMessage) <= maxAllowedSize) {
		return false;
	}
	const fileUploadsEnabled = settings.get('FileUpload_Enabled');
	const convertLongMessagesToAttachment = settings.get('Message_AllowConvertLongMessagesToAttachment');

	if (chat.currentEditing || !fileUploadsEnabled || !convertLongMessagesToAttachment) {
		dispatchToastMessage({ type: 'error', message: new Error(t('Message_too_long')) });
		chat.composer?.setText(msg);
		return true;
	}

	await new Promise<void>((resolve) => {
		const onConfirm = async (): Promise<void> => {
			const contentType = 'text/plain';
			const messageBlob = new Blob([msg], { type: contentType });
			const fileName = `${Meteor.user()?.username ?? 'anonymous'} - ${new Date()}.txt`; // TODO: proper naming and formatting
			const file = new File([messageBlob], fileName, {
				type: contentType,
				lastModified: Date.now(),
			});
			await chat.flows.uploadFiles([file]);

			imperativeModal.close();
			resolve();
		};

		const onClose = (): void => {
			chat.composer?.setText(msg);

			imperativeModal.close();
			resolve();
		};

		imperativeModal.open({
			component: GenericModal,
			props: {
				title: t('Message_too_long'),
				children: t('Send_it_as_attachment_instead_question'),
				onConfirm,
				onClose,
				onCancel: onClose,
				variant: 'warning',
			},
		});
	});

	return true;
};
