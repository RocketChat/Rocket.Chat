import { Box, Button, ButtonGroup, EmailInput, Field, Margins, TextInput } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import React, { useState, useMemo } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useMethod } from '../../contexts/ServerContext';

const supportEmailAddress = 'support@rocket.chat';

function WorkspaceRegistrationSection({
	registerStatus,
	onRegisterStatusChange,
	...props
}) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const updateEmail = useMethod('cloud:updateEmail');
	const connectWorkspace = useMethod('cloud:connectWorkspace');

	const [email, setEmail] = useState(registerStatus?.email);
	const [token, setToken] = useState(registerStatus?.token);

	const supportMailtoUrl = useMemo(() => {
		const workspaceId = registerStatus?.workspaceId;
		const uniqueId = registerStatus?.uniqueId;
		const subject = encodeURIComponent('Self Hosted Registration');
		const body = encodeURIComponent([
			`WorkspaceId: ${ workspaceId }`,
			`Deployment Id: ${ uniqueId }`,
			'Issue: <please describe your issue here>',
		].join('\r\n'));
		return `mailto:${ supportEmailAddress }?subject=${ subject }&body=${ body }`;
	}, [registerStatus]);

	const handleEmailChange = ({ currentTarget: { value } }) => {
		setEmail(value);
	};

	const handleTokenChange = ({ currentTarget: { value } }) => {
		setToken(value);
	};

	const handleUpdateEmailButtonClick = async () => {
		try {
			await updateEmail(email, false);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const handleResendEmailButtonClick = async () => {
		try {
			await updateEmail(email, true);
			dispatchToastMessage({ type: 'success', message: t('Requested') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const handleConnectButtonClick = async () => {
		try {
			const isConnected = await connectWorkspace(token);

			if (!isConnected) {
				throw Error(t('An error occured connecting'));
			}

			dispatchToastMessage({ type: 'success', message: t('Connected') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			onRegisterStatusChange && onRegisterStatusChange();
		}
	};

	const emailInputId = useUniqueId();
	const tokenInputId = useUniqueId();

	return <Box marginBlock='neg-x24' {...props}>
		<Margins block='x24'>
			<Field>
				<Field.Label htmlFor={emailInputId}>{t('Email')}</Field.Label>
				<Field.Row>
					<EmailInput id={emailInputId} value={email} onChange={handleEmailChange} />
				</Field.Row>
				<Field.Hint>{t('Cloud_address_to_send_registration_to')}</Field.Hint>
			</Field>

			<ButtonGroup>
				<Button onClick={handleUpdateEmailButtonClick}>{t('Cloud_update_email')}</Button>
				<Button onClick={handleResendEmailButtonClick}>{t('Cloud_resend_email')}</Button>
			</ButtonGroup>

			<Field>
				<Field.Label htmlFor={tokenInputId}>{t('Token')}</Field.Label>
				<Field.Row>
					<TextInput id={tokenInputId} value={token} onChange={handleTokenChange} />
				</Field.Row>
				<Field.Hint>{t('Cloud_manually_input_token')}</Field.Hint>
			</Field>

			<ButtonGroup>
				<Button primary onClick={handleConnectButtonClick}>{t('Connect')}</Button>
			</ButtonGroup>

			<Box withRichContent>
				<p>{t('Cloud_connect_support')}: <a href={supportMailtoUrl} target='_blank' rel='noopener noreferrer'>{supportEmailAddress}</a></p>
			</Box>
		</Margins>
	</Box>;
}

export default WorkspaceRegistrationSection;
