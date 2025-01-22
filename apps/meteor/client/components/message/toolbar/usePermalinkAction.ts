import type { IMessage } from '@rocket.chat/core-typings';
import { isE2EEMessage } from '@rocket.chat/core-typings';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import type { MessageActionConfig, MessageActionContext } from '../../../../app/ui-utils/client/lib/MessageAction';
import { getPermaLink } from '../../../lib/getPermaLink';

export const usePermalinkAction = (
	message: IMessage,
	{ id, context, type, order }: { context: MessageActionContext[]; order: number } & Pick<MessageActionConfig, 'id' | 'type'>,
): MessageActionConfig | null => {
	const { t } = useTranslation();

	const dispatchToastMessage = useToastMessageDispatch();

	const encrypted = isE2EEMessage(message);

	return {
		id,
		icon: 'permalink',
		label: 'Copy_link',
		context,
		type,
		async action() {
			try {
				const permalink = await getPermaLink(message._id);
				navigator.clipboard.writeText(permalink);
				dispatchToastMessage({ type: 'success', message: t('Copied') });
			} catch (e) {
				dispatchToastMessage({ type: 'error', message: e });
			}
		},
		order,
		group: 'menu',
		disabled: encrypted,
	};
};
