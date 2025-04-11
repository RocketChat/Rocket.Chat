import { NavBarItem } from '@rocket.chat/fuselage';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useVoipAPI, useVoipState } from '@rocket.chat/ui-voip';
import { useMutation } from '@tanstack/react-query';
import type { HTMLAttributes } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type NavBarItemVoipDialerProps = Omit<HTMLAttributes<HTMLElement>, 'is'> & {
	primary?: boolean;
};

const NavBarItemVoipToggler = (props: NavBarItemVoipDialerProps) => {
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

	const title = useMemo(() => {
		if (clientError) {
			return t(clientError.message);
		}

		if (!isReady || toggleVoip.isPending) {
			return t('Loading');
		}

		return isRegistered ? t('Disable_voice_calling') : t('Enable_voice_calling');
	}, [clientError, isRegistered, isReady, toggleVoip.isPending, t]);

	return isEnabled ? (
		<NavBarItem
			{...props}
			title={title}
			icon={isRegistered ? 'phone-disabled' : 'phone'}
			disabled={!isReady || toggleVoip.isPending}
			onClick={() => toggleVoip.mutate()}
		/>
	) : null;
};

export default NavBarItemVoipToggler;
