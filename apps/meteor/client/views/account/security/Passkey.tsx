import {
	Box,
	Button,
	ButtonGroup,
	Field,
	FieldGroup,
	FieldLabel,
	FieldRow,
	Icon,
	IconButton,
	Margins,
	Tag,
	TextInput,
} from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useMethod, useSetModal } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useEndpointAction } from '/client/hooks/useEndpointAction';
import { startRegistration, base64URLStringToBuffer } from '@simplewebauthn/browser';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableRow,
} from '/client/components/GenericTable';
import GenericModal from '/client/components/GenericModal';
import DOMPurify from 'dompurify';
import { Controller } from 'react-hook-form';
import { useFormatDate } from '/client/hooks/useFormatDate';

// TODO fzh075 loading and reload
const Passkey = (props: ComponentProps<typeof Box>) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const closeModal = useCallback(() => setModal(null), [setModal]);
	const formatDate = useFormatDate();

	const [passkeys, setPasskeys] = useState([]);
	// TODO fzh075 createPasskey const [name, setName] = useState([]);
	// const user = useUser();

	// const isEnabled = user?.services?.email2fa?.enabled;

	const generateRegistrationOptionsAction = useEndpointAction('GET', '/v1/users.generateRegistrationOptions');
	const verifyRegistrationResponseAction = useEndpointAction('POST', '/v1/users.verifyRegistrationResponse');

	const handleCreate = useCallback(async () => {
		try {
			const { id, options } = await generateRegistrationOptionsAction();

			const registrationResponse = await startRegistration({ optionsJSON: options });

			await verifyRegistrationResponseAction({ id, registrationResponse });

			// const onConfirm = () => {
			//
			// closeModal()
			// }
			//
			// setModal(
			// 	<GenericModal confirmText={t('Remove')} onConfirm={onConfirm} onCancel={closeModal} onClose={closeModal}>
			//
			// 		<GenericModal title={t('Create')} onConfirm={() => handleConfirmEdit(editing, name)} onClose={() => setEditing('')}>
			// 			<TextInput value={name} onChange={(e) => setName(e.currentTarget.value)} />
			// 		{t('Passkeys_Remove_Modal')}
			// 	</GenericModal>,
			// );

			dispatchToastMessage({ type: 'success', message: t('Registered_successfully') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [generateRegistrationOptionsAction, verifyRegistrationResponseAction]);

	const [editing, setEditing] = useState(''); // TODO fzh075 The naming needs to be optimized.
	const [name, setName] = useState('');
	const findPasskeysAction = useEndpointAction('GET', '/v1/users.findPasskeys');
	const editPasskeyAction = useEndpointAction('PUT', '/v1/users.editPasskey');
	const deletePasskeyAction = useEndpointAction('DELETE', '/v1/users.deletePasskey');

	const isSeenFromThisBrowser = async (credentialIdBase64) => {
		try {
			const credentialId = base64URLStringToBuffer(credentialIdBase64);
			await navigator.credentials.get({
				publicKey: {
					challenge: new Uint8Array(32), // dummy
					rpId: window.location.hostname,
					allowCredentials: [
						{
							id: credentialId,
							type: 'public-key',
						},
					],
					timeout: 3000,
				},
			});
			return true;
		} catch {
			return false;
		}
	};

	const findPasskeys = useCallback(async () => {
		try {
			const { passkeys } = await findPasskeysAction();
			console.log(passkeys);

			const results = await Promise.all(
				passkeys.map(async (passkey) => ({
					...passkey,
					seenFromThisBrowser: await isSeenFromThisBrowser(passkey.credentialId),
				})),
			);

			setPasskeys(results);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [findPasskeysAction]);
	useEffect(() => {
		findPasskeys().then();
	}, []);

	// TODO fzh075 model optimization
	const handleEdit = async (passkeyId, name) => {
		setName(name);
		setEditing(passkeyId);
	};
	const handleConfirmEdit = useCallback(
		async (passkeyId, name) => {
			try {
				await editPasskeyAction({ passkeyId, name });
				dispatchToastMessage({ type: 'success', message: t('Edited_successfully') });
				await findPasskeys();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		[editPasskeyAction],
	);
	const handleDelete = useCallback(
		async (passkeyId) => {
			const onConfirm: () => Promise<void> = async () => {
				try {
					await deletePasskeyAction({ passkeyId });
					dispatchToastMessage({ type: 'success', message: t('Deleted_successfully') });
					await findPasskeys();
					closeModal();
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
			};

			setModal(
				<GenericModal variant='danger' confirmText={t('Remove')} onConfirm={onConfirm} onCancel={closeModal} onClose={closeModal}>
					{t('Passkeys_Remove_Modal')}
				</GenericModal>,
			);
		},
		[deletePasskeyAction, setModal, closeModal],
	);

	return (
		<Box>
			<Box fontScale='p2' mbe='x16'>
				Passkeys are webauthn credentials that validate your identity using touch, facial recognition, a device password, or a PIN. They can
				be used as a password replacement or as a 2FA method.
			</Box>
			<Box border='1px solid var(--rcx-color-neutral-200, #e4e7eb)' borderRadius='x4'>
				{/* TODO fzh075 aria-busy={isLoading}*/}
				<Box
					display='flex'
					justifyContent='space-between'
					alignItems='center'
					p='x16'
					borderBlockEnd='1px solid var(--rcx-color-neutral-200, #e4e7eb)'
					backgroundColor='var(--rcx-color-neutral-100, #f7f8fa)'
				>
					<Box fontScale='h4'>{t('Your-passkeys')}</Box>
					<Button primary onClick={handleCreate}>
						{t('Add-a-passkey')}
					</Button>
				</Box>
				<GenericTable>
					<GenericTableBody>
						{/*{phase === AsyncStatePhase.LOADING && <GenericTableLoadingTable headerCells={5} />}*/
						passkeys?.map((passkey) => (
							<GenericTableRow key={passkey.id} borderBlockEnd='1px solid var(--rcx-color-neutral-200, #e4e7eb)'>
								<GenericTableCell withTruncatedText>
									<Box display='flex' alignItems='center' p='x16'>
										<Icon name='key' size='x20' mie='x8' />
										<Box fontScale='p2' mie='x8'>
											{passkey.name}
										</Box>
										{passkey.seenFromThisBrowser && (
											<Tag variant='secondary' mie='x8'>
												{t('Seen_from_this_browser')}
											</Tag>
										)}
										{passkey.resident && <Tag variant='secondary'>{t('Resident')}</Tag>}
									</Box>
									<Box fontScale='c1' color='hint' mt='x4' p='x16' pbs='x0'>
										Added on {formatDate(new Date(passkey.createdAt))} | Last used {formatDate(new Date(passkey.lastUsedAt))}
									</Box>
								</GenericTableCell>
								<GenericTableCell align='end' p='x16'>
									<ButtonGroup align='end'>
										<IconButton title={t('Edit')} icon='edit' small mie='x4' onClick={() => handleEdit(passkey.id, passkey.name)} />
										<IconButton title={t('Delete')} icon='trash' danger small onClick={() => handleDelete(passkey.id)} />
									</ButtonGroup>
								</GenericTableCell>
							</GenericTableRow>
						))}
					</GenericTableBody>
				</GenericTable>
				{editing && (
					<GenericModal title={t('Edit')} onConfirm={() => handleConfirmEdit(editing, name)} onClose={() => setEditing('')}>
						<TextInput value={name} onChange={(e) => setName(e.currentTarget.value)} />
						{/*<FieldGroup>*/}
						{/*	<Field>*/}
						{/*		<FieldLabel htmlFor={textField}>{t('Text')}</FieldLabel>*/}
						{/*		<FieldRow>*/}
						{/*			<Controller control={control} name='text' render={({ field }) => <TextInput autoComplete='off' id={textField} {...field} />} />*/}
						{/*		</FieldRow>*/}
						{/*	</Field>*/}
						{/*	<Field>*/}
						{/*		<FieldLabel htmlFor={urlField}>{t('URL')}</FieldLabel>*/}
						{/*		<FieldRow>*/}
						{/*			<Controller control={control} name='url' render={({ field }) => <TextInput autoComplete='off' id={urlField} {...field} />} />*/}
						{/*		</FieldRow>*/}
						{/*	</Field>*/}
						{/*</FieldGroup>*/}
					</GenericModal>
				)}
			</Box>
		</Box>
		// <Box display='flex' flexDirection='column' alignItems='flex-start' mbs={16} {...props}>
		// 	<Margins blockEnd={8}>
		// 		<Box fontScale='h4'>{t('Your-passkeys')}</Box>
		// 			<Button primary onClick={handleCreate}>
		// 				{t('Add-a-passkey')}
		// 			</Button>
		// 		<Box>
		// 		Passkey
		// 		{/*<Button onClick={handleEdit}>*/}
		// 		{/*	{t('Edit')}*/}
		// 		{/*</Button>*/}
		// 		{/*<Button danger onClick={handleDelete}>*/}
		// 		{/*	{t('Delete')}*/}
		// 		{/*</Button>*/}
		// 		</Box>
		// 	</Margins>
		// </Box>
	);
};

export default Passkey;
