import type { IMessage } from '@rocket.chat/core-typings';
import { GenericModal, imperativeModal } from '@rocket.chat/ui-client';

import { t } from '../../../../app/utils/lib/i18n';
import { settings } from '../../settings';

const groupMentionRegex = /(^|\s|>)@(all|here)(?![0-9A-Za-z_.-])/m;

export const processGroupMentionConfirmation = async ({ msg }: Pick<IMessage, 'msg'>): Promise<boolean> => {
	if (settings.peek('Message_ConfirmGroupMentions') === false || !groupMentionRegex.test(msg)) {
		return true;
	}

	return new Promise<boolean>((resolve) => {
		const close = (confirmed = false): void => {
			imperativeModal.close();
			resolve(confirmed);
		};

		imperativeModal.open({
			component: GenericModal,
			props: {
				title: t('Confirm_group_mention'),
				children: t('Confirm_group_mention_description'),
				confirmText: t('Send_anyway'),
				onConfirm: () => close(true),
				onClose: close,
				onCancel: close,
				variant: 'warning',
			},
		});
	});
};
