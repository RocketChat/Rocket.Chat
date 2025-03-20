import { useSession } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

export const useUnreadMessages = (): string | undefined => {
	const { t } = useTranslation();
	const unreadMessages = useSession('unread') as number | '' | '999+' | '•';

	return (() => {
		// TODO: remove this when we have a better way to handle this
		if (typeof unreadMessages !== 'number') {
			return undefined;
		}

		return t('unread_messages_counter', { count: unreadMessages });
	})();
};
