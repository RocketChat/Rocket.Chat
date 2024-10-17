import { Box } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useVoipAPI, useVoipState } from '@rocket.chat/ui-voip';
import { useMutation } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const useVoipItemsSection = (): { items: GenericMenuItemProps[] } | undefined => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const { clientError, isEnabled, isReady, isRegistered } = useVoipState();
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

	const tooltip = useMemo(() => {
		if (clientError) {
			return t(clientError.message);
		}

		if (!isReady || toggleVoip.isLoading) {
			return t('Loading');
		}

		return '';
	}, [clientError, isReady, toggleVoip.isLoading, t]);

	return useMemo(() => {
		if (!isEnabled) {
			return;
		}

		return {
			items: [
				{
					id: 'toggle-voip',
					icon: isRegistered ? 'phone-disabled' : 'phone',
					disabled: !isReady || toggleVoip.isLoading,
					onClick: () => toggleVoip.mutate(),
					content: (
						<Box is='span' title={tooltip}>
							{isRegistered ? t('Disable_voice_calling') : t('Enable_voice_calling')}
						</Box>
					),
				},
			],
		};
	}, [isEnabled, isRegistered, isReady, tooltip, t, toggleVoip]);
};
