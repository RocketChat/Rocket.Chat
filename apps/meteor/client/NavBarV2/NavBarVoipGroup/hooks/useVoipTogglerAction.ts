import type { Keys } from '@rocket.chat/icons';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useVoipAPI, useVoipState } from '@rocket.chat/ui-voip';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const useVoipTogglerAction = () => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const { clientError, isReady, isRegistered, isReconnecting } = useVoipState();
	const { register, unregister, onRegisteredOnce, onUnregisteredOnce } = useVoipAPI();

	const toggleVoip = useMutation({
		mutationFn: async () => {
			if (!isRegistered) {
				await register();
				return true;
			}

			await unregister();
			return false;
		},
		onSuccess: (isEnabled: boolean) => {
			if (isEnabled) {
				onRegisteredOnce(() => dispatchToastMessage({ type: 'success', message: t('Voice_calling_enabled') }));
			} else {
				onUnregisteredOnce(() => dispatchToastMessage({ type: 'success', message: t('Voice_calling_disabled') }));
			}
		},
		onError: () => {
			dispatchToastMessage({ type: 'error', message: t('Voice_calling_registration_failed') });
		},
	});

	const title = useMemo(() => {
		if (clientError) {
			return t(clientError.message);
		}

		if (!isReady || toggleVoip.isPending) {
			return t('Loading');
		}

		if (isReconnecting) {
			return t('Reconnecting');
		}

		return isRegistered ? t('Disable_voice_calling') : t('Enable_voice_calling');
	}, [clientError, isRegistered, isReconnecting, isReady, toggleVoip.isPending, t]);

	return {
		handleToggleVoip: () => toggleVoip.mutate(),
		title,
		icon: (isRegistered ? 'phone' : 'phone-disabled') as Keys,
		isRegistered,
		isDisabled: !isReady || toggleVoip.isPending || isReconnecting,
	};
};
