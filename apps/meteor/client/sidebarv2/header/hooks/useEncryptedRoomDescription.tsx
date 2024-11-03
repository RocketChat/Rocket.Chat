import { useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

export const useEncryptedRoomDescription = (roomType: 'channel' | 'team') => {
	const { t } = useTranslation();
	const e2eEnabled = useSetting('E2E_Enable');
	const e2eEnabledForPrivateByDefault = useSetting('E2E_Enabled_Default_PrivateRooms');

	return ({ isPrivate, broadcast, encrypted }: { isPrivate: boolean; broadcast: boolean; encrypted: boolean }) => {
		if (!e2eEnabled) {
			return t('Not_available_for_this_workspace');
		}
		if (!isPrivate) {
			return t('Encrypted_not_available', { roomType });
		}
		if (broadcast) {
			return t('Not_available_for_broadcast', { roomType });
		}
		if (e2eEnabledForPrivateByDefault || encrypted) {
			return t('Encrypted_messages', { roomType });
		}
		return t('Encrypted_messages_false');
	};
};
