import { Accounts } from 'meteor/accounts-base';
import { useTranslation } from 'react-i18next';
import { useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useEndpointAction } from '/client/hooks/useEndpointAction';
import { startRegistration } from '@simplewebauthn/browser';
import React from 'react';

import PasskeyFirstCreateModel from '/client/views/account/security/PasskeyFirstCreateModal.tsx';

Accounts.onLogin(async ({ user }) => {
	console.log(11111111, user);
	const dontAskAgain = localStorage.getItem(`DontAskAgainForPasskey_${user._id}`) === 'true';
	if (dontAskAgain) {
		return;
	}

	const findPasskeysAction = useEndpointAction('GET', '/v1/users.findPasskeys');
	let platform;
	if ('userAgentData' in navigator) {
		platform = navigator.userAgentData?.platform;
		console.log(platform);
	} else {
		const ua = navigator.userAgent;
		if (/Windows NT/.test(ua)) {
			platform = 'Windows';
		} else if (/Mac OS X/.test(ua)) {
			platform = 'macOS';
		} else if (/Linux/.test(ua)) {
			platform = 'Linux';
		} else if (/Android/.test(ua)) {
			platform = 'Android';
		} else if (/iPhone|iPad|iPod/.test(ua)) {
			platform = 'iOS';
		}
	}
	if (!platform) {
		return;
	}
	const { passkeys } = await findPasskeysAction();
	for (const passkey of passkeys) {
		if (passkey.sync || passkey.platform === platform) {
			return;
		}
	}

	// TODO fzh075 duplicate code
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const closeModal = () => setModal(null);

	const generateRegistrationOptionsAction = useEndpointAction('GET', '/v1/users.generateRegistrationOptions');
	const verifyRegistrationResponseAction = useEndpointAction('POST', '/v1/users.verifyRegistrationResponse');

	const handleConfirmCreate = async (name) => {
		try {
			const { id, options } = await generateRegistrationOptionsAction();

			const registrationResponse = await startRegistration({ optionsJSON: options });

			await verifyRegistrationResponseAction({ id, registrationResponse, name });

			dispatchToastMessage({ type: 'success', message: t('Registered_successfully') });
			closeModal();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};
	const onDontAskAgain = () => {
		localStorage.setItem(`DontAskAgainForPasskey_${user._id}`, 'true');
	};

	setModal(<PasskeyFirstCreateModel onConfirm={handleConfirmCreate} onClose={closeModal} onDontAskAgain={onDontAskAgain} />);
});
