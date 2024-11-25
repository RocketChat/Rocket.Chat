import type { IMessage, ISubscription, IUser } from '@rocket.chat/core-typings';
import { isE2EEMessage } from '@rocket.chat/core-typings';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import { getPermaLink } from '../../../lib/getPermaLink';

export const usePermalinkStar = (
	message: IMessage,
	{ user, subscription }: { user: IUser | undefined; subscription: ISubscription | undefined },
) => {
	const { t } = useTranslation();

	const dispatchToastMessage = useToastMessageDispatch();

	const encrypted = isE2EEMessage(message);

	useEffect(() => {
		if (!subscription) {
			return;
		}

		MessageAction.addButton({
			id: 'permalink-star',
			icon: 'permalink',
			label: 'Copy_link',
			context: ['starred'],
			async action() {
				try {
					const permalink = await getPermaLink(message._id);
					navigator.clipboard.writeText(permalink);
					dispatchToastMessage({ type: 'success', message: t('Copied') });
				} catch (e) {
					dispatchToastMessage({ type: 'error', message: e });
				}
			},
			order: 10,
			group: 'menu',
			disabled: () => encrypted,
		});

		return () => {
			MessageAction.removeButton('permalink-star');
		};
	}, [dispatchToastMessage, encrypted, message._id, message.starred, subscription, t, user?._id]);
};
