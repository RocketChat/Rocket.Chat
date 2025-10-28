import { useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

export const useEncryptedRoomDescription = (roomType: 'channel' | 'team' | 'discussion') => {
	const { t } = useTranslation();
	const e2eEnabled = useSetting('E2E_Enable');

	return ({ isPrivate, encrypted }: { isPrivate: boolean; encrypted: boolean }) => {
		if (!e2eEnabled) {
			return t('Not_available_for_this_workspace');
		}
		if (!isPrivate) {
			return t('Encrypted_not_available', { roomType: t(roomType) });
		}
		if (encrypted) {
			return t('Encrypted_messages', { roomType: t(roomType) });
		}
		return t('Encrypted_messages_false');
	};
};
