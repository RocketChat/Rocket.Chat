import { useSession, useTranslation } from '@rocket.chat/ui-contexts';

export const useUnreadMessages = (): string | undefined => {
	const t = useTranslation();
	const unreadMessages = useSession('unread');

	return (() => {
		if (unreadMessages === '') {
			return undefined;
		}

		return t('unread_messages_counter', { count: unreadMessages });
	})();
};
