import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import { isE2EEMessage } from '@rocket.chat/core-typings';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import type { MessageActionConfig, MessageActionContext } from '../../../../app/ui-utils/client/lib/MessageAction';
import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import { getPermaLink } from '../../../lib/getPermaLink';

export const usePermalinkAction = (
	message: IMessage,
	{
		subscription,
		id,
		context,
		type,
		order,
	}: { subscription: ISubscription | undefined; context: MessageActionContext[]; order: number } & Pick<MessageActionConfig, 'id' | 'type'>,
) => {
	const { t } = useTranslation();

	const dispatchToastMessage = useToastMessageDispatch();

	const encrypted = isE2EEMessage(message);

	useEffect(() => {
		MessageAction.addButton({
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
			disabled: () => encrypted,
		});

		return () => {
			MessageAction.removeButton(id);
		};
	}, [context, dispatchToastMessage, encrypted, id, message._id, order, subscription, t, type]);
};
