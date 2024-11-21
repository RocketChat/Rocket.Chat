import { isE2EEMessage } from '@rocket.chat/core-typings';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import { getPermaLink } from '../../../lib/getPermaLink';

export const usePermalinkStar = () => {
	const { t } = useTranslation();

	const dispatchToastMessage = useToastMessageDispatch();

	useEffect(() => {
		MessageAction.addButton({
			id: 'permalink-star',
			icon: 'permalink',
			label: 'Copy_link',
			context: ['starred', 'threads', 'videoconf-threads'],
			async action(_, { message }) {
				try {
					const permalink = await getPermaLink(message._id);
					navigator.clipboard.writeText(permalink);
					dispatchToastMessage({ type: 'success', message: t('Copied') });
				} catch (e) {
					dispatchToastMessage({ type: 'error', message: e });
				}
			},
			condition({ message, subscription, user }) {
				if (subscription == null) {
					return false;
				}

				return Boolean(message.starred?.find((star) => star._id === user?._id));
			},
			order: 10,
			group: 'menu',
			disabled({ message }) {
				return isE2EEMessage(message);
			},
		});

		return () => {
			MessageAction.removeButton('permalink-star');
		};
	}, [dispatchToastMessage, t]);
};
