import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import type { MessageActionConfig } from '../../../../app/ui-utils/client/lib/MessageAction';

const getMainMessageText = (message: IMessage): IMessage => {
	const newMessage = { ...message };
	newMessage.msg = newMessage.msg || newMessage.attachments?.[0]?.description || newMessage.attachments?.[0]?.title || '';
	newMessage.md = newMessage.md || newMessage.attachments?.[0]?.descriptionMd || undefined;
	return { ...newMessage };
};

export const useCopyAction = (
	message: IMessage,
	{ subscription }: { subscription: ISubscription | undefined },
): MessageActionConfig | null => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	if (!subscription) {
		return null;
	}

	return {
		id: 'copy',
		icon: 'copy',
		label: 'Copy_text',
		context: ['message', 'message-mobile', 'threads', 'federated'],
		type: 'duplication',
		async action() {
			const msgText = getMainMessageText(message).msg;
			await navigator.clipboard.writeText(msgText);
			dispatchToastMessage({ type: 'success', message: t('Copied') });
		},
		order: 6,
		group: 'menu',
	};
};
