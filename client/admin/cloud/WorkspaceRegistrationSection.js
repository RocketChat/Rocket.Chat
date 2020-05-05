import { Box, Button, ButtonGroup, EmailInput, Field, Margins, TextInput } from '@rocket.chat/fuselage';
import { useSafely, useUniqueId } from '@rocket.chat/fuselage-hooks';
import React, { useState, useMemo } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useMethod } from '../../contexts/ServerContext';
import { supportEmailAddress } from './constants';

function WorkspaceRegistrationSection({
	email: initialEmail,
	token: initialToken,
	workspaceId,
	uniqueId,
	onRegisterStatusChange,
	...props
}) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const updateEmail = useMethod('cloud:updateEmail');
	const connectWorkspace = useMethod('cloud:connectWorkspace');

	const [isProcessing, setProcessing] = useSafely(useState(false));
	const [email, setEmail] = useState(initialEmail);
	const [token, setToken] = useState(initialToken);

	const supportMailtoUrl = useMemo(() => {
		const subject = encodeURIComponent('Self Hosted Registration');
		const body = encodeURIComponent([
			`WorkspaceId: ${ workspaceId }`,
			`Deployment Id: ${ uniqueId }`,
			'Issue: <please describe your issue here>',
		].join('\r\n'));
		return `mailto:${ supportEmailAddress }?subject=${ subject }&body=${ body }`;
	}, [workspaceId, uniqueId]);

	const handleEmailChange = ({ currentTarget: { value } }) => {
		setEmail(value);
	};

	const handleTokenChange = ({ currentTarget: { value } }) => {
		setToken(value);
	};

	const handleUpdateEmailButtonClick = async () => {
		setProcessing(true);

		try {
			await updateEmail(email, false);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setProcessing(false);
		}
	};

	const handleResendEmailButtonClick = async () => {
		setProcessing(true);

		try {
			await updateEmail(email, true);
			dispatchToastMessage({ type: 'success', message: t('Requested') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setProcessing(false);
		}
	};

	const handleConnectButtonClick = async () => {
		setProcessing(true);

		try {
			const isConnected = await connectWorkspace(token);

			if (!isConnected) {
				throw Error(t('An error occured connecting'));
			}

			dispatchToastMessage({ type: 'success', message: t('Connected') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			await (onRegisterStatusChange && onRegisterStatusChange());
			setProcessing(false);
		}
	};

	const emailInputId = useUniqueId();
	const tokenInputId = useUniqueId();

	return <Box marginBlock='neg-x24' {...props}>
		<Margins block='x24'>
			<Field>
				<Field.Label htmlFor={emailInputId}>{t('Email')}</Field.Label>
				<Field.Row>
					<EmailInput id={emailInputId} disabled={isProcessing} value={email} onChange={handleEmailChange} />
				</Field.Row>
				<Field.Hint>{t('Cloud_address_to_send_registration_to')}</Field.Hint>
			</Field>

			<ButtonGroup>
				<Button disabled={isProcessing} onClick={handleUpdateEmailButtonClick}>{t('Cloud_update_email')}</Button>
				<Button disabled={isProcessing} onClick={handleResendEmailButtonClick}>{t('Cloud_resend_email')}</Button>
			</ButtonGroup>

			<Field>
				<Field.Label htmlFor={tokenInputId}>{t('Token')}</Field.Label>
				<Field.Row>
					<TextInput id={tokenInputId} disabled={isProcessing} value={token} onChange={handleTokenChange} />
				</Field.Row>
				<Field.Hint>{t('Cloud_manually_input_token')}</Field.Hint>
			</Field>

			<ButtonGroup>
				<Button primary disabled={isProcessing} onClick={handleConnectButtonClick}>{t('Connect')}</Button>
			</ButtonGroup>

			<Box withRichContent>
				<p>{t('Cloud_connect_support')}: <a href={supportMailtoUrl} target='_blank' rel='noopener noreferrer'>{supportEmailAddress}</a></p>
			</Box>
		</Margins>
	</Box>;
}

export default WorkspaceRegistrationSection;
