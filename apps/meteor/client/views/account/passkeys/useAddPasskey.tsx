import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { startRegistration } from '@simplewebauthn/browser';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import PasskeyNameModal from './PasskeyNameModal';
import { getAddPasskeyErrorMessage } from './getAddPasskeyErrorMessage';
import { getDefaultPasskeyName } from './getDefaultPasskeyName';
import { isTwoFactorCancelledError } from '../../../lib/2fa/utils';
import { isPasskeyCeremonyCancelled } from '../../../lib/passkeys/errors';
import { passkeysQueryKeys } from '../../../lib/queryKeys';

export const useAddPasskey = () => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();

	const generateRegistrationOptions = useEndpoint('POST', '/v1/passkeys.generateRegistrationOptions');
	const registerPasskey = useEndpoint('POST', '/v1/passkeys.register');

	return useMutation({
		mutationFn: async () => {
			const { options } = await generateRegistrationOptions();
			const credential = await startRegistration({ optionsJSON: options });
			const name = getDefaultPasskeyName(t, credential.authenticatorAttachment, navigator.userAgent);

			return (await registerPasskey({ name, credential })).passkey;
		},
		onSuccess: (passkey) => {
			void queryClient.invalidateQueries({ queryKey: passkeysQueryKeys.all });
			dispatchToastMessage({ type: 'success', message: t('Passkey_added') });
			setModal(<PasskeyNameModal passkey={passkey} isNew onClose={() => setModal(null)} />);
		},
		onError: (error) => {
			if (isPasskeyCeremonyCancelled(error) || isTwoFactorCancelledError(error)) {
				return;
			}

			dispatchToastMessage({ type: 'error', message: getAddPasskeyErrorMessage(t, error) });
		},
	});
};
