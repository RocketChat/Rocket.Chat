import type { IMessage } from '@rocket.chat/core-typings';
import { GenericModal, imperativeModal } from '@rocket.chat/ui-client';

import { t } from '../../../../lib/i18n';
import { settings } from '../../settings';
import { dispatchToastMessage } from '../../toast';
import { getUser } from '../../user';
import type { ChatAPI } from '../ChatAPI';
import { processTooLongMessageCore } from '../core/processTooLongMessage';
import type { TooLongChat } from '../core/processTooLongMessage';

const offerAttachment = (msg: string, chat: TooLongChat): Promise<void> =>
	new Promise<void>((resolve) => {
		const onConfirm = async (): Promise<void> => {
			const contentType = 'text/plain';
			const messageBlob = new Blob([msg], { type: contentType });
			const fileName = `${getUser()?.username ?? 'anonymous'} - ${new Date().toString()}.txt`; // TODO: proper naming and formatting
			const file = new File([messageBlob], fileName, {
				type: contentType,
				lastModified: Date.now(),
			});

			chat.composer?.clear();
			imperativeModal.close();
			await chat.flows.uploadFiles({ files: [file] });

			resolve();
		};

		const onClose = (): void => {
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

export const processTooLongMessage = (chat: ChatAPI, message: Pick<IMessage, 'msg'>): Promise<boolean> =>
	processTooLongMessageCore(
		{
			getMaxAllowedSize: () => settings.peek('Message_MaxAllowedSize'),
			isFileUploadEnabled: () => settings.peek('FileUpload_Enabled'),
			isConvertToAttachmentAllowed: () => settings.peek('Message_AllowConvertLongMessagesToAttachment'),
			notifyTooLong: () => dispatchToastMessage({ type: 'error', message: new Error(t('Message_too_long')) }),
			offerAttachment,
		},
		chat,
		message,
	);
