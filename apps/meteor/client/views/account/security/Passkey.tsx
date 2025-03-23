import { Box, Button, Margins } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useMethod } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useEndpointAction } from '/client/hooks/useEndpointAction';
import { startRegistration } from '@simplewebauthn/browser';

const Passkey = (props: ComponentProps<typeof Box>) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	// const user = useUser();

	// const isEnabled = user?.services?.email2fa?.enabled;

	// const generateRegistrationOptionsFn = useMethod('passkey:generateRegistrationOptions');
	// const verifyRegistrationResponseFn = useMethod('passkey:verifyRegistrationResponse');
	const generateRegistrationOptionsAction = useEndpointAction('GET', '/v1/users.generateRegistrationOptions');
	const verifyRegistrationResponseAction = useEndpointAction('POST', '/v1/users.verifyRegistrationResponse');

	const handleCreate = useCallback(async () => {
		try {
			const { id, options } = await generateRegistrationOptionsAction();

			const registrationResponse = await startRegistration({ optionsJSON: options});

			await verifyRegistrationResponseAction(id, registrationResponse)

			dispatchToastMessage({ type: 'success', message: t('Registered_successfully') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [generateRegistrationOptionsAction, verifyRegistrationResponseAction]);

	return (
		<Box display='flex' flexDirection='column' alignItems='flex-start' mbs={16} {...props}>
			<Margins blockEnd={8}>
				<Box fontScale='h4'>{t('Your-passkeys')}</Box>
				<Button primary onClick={handleCreate}>
					{t('Add-a-passkey')}
				</Button>
				<Box>
					Passkey
					{/*<Button onClick={handleEdit}>*/}
					{/*	{t('Edit')}*/}
					{/*</Button>*/}
					{/*<Button danger onClick={handleDelete}>*/}
					{/*	{t('Delete')}*/}
					{/*</Button>*/}
				</Box>
			</Margins>
		</Box>
	);
};

export default Passkey;
