import { Box, Button, ButtonGroup, Icon, IconButton, Tag } from '@rocket.chat/fuselage';
import { GenericModal, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { startRegistration } from '@simplewebauthn/browser';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useEndpointAction } from '/client/hooks/useEndpointAction';
import { GenericTable, GenericTableBody, GenericTableCell, GenericTableRow } from '/client/components/GenericTable';
import { useFormatDate } from '/client/hooks/useFormatDate';

import PasskeyCreateModel from './PasskeyCreateModal';
import PasskeyEditModel from './PasskeyEditModal';

// TODO fzh075 loading and reload
const Passkey = () => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const closeModal = () => setModal(null);
	const formatDate = useFormatDate();

	const [passkeys, setPasskeys] = useState([]);
	// const user = useUser();

	// const isEnabled = user?.services?.email2fa?.enabled;

	const findPasskeysAction = useEndpointAction('GET', '/v1/users.findPasskeys');
	const generateRegistrationOptionsAction = useEndpointAction('GET', '/v1/users.generateRegistrationOptions');
	const verifyRegistrationResponseAction = useEndpointAction('POST', '/v1/users.verifyRegistrationResponse');
	const editPasskeyAction = useEndpointAction('PUT', '/v1/users.editPasskey');
	const deletePasskeyAction = useEndpointAction('DELETE', '/v1/users.deletePasskey');

	const findPasskeys = async () => {
		try {
			const { passkeys } = await findPasskeysAction();
			passkeys.forEach((passkey) => {
				passkey.seenFromThisBrowser = localStorage.getItem(`PasskeySeenFromThisBrowser_${passkey.id}`) === 'true';
			});
			setPasskeys(passkeys);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};
	useEffect(() => {
		findPasskeys().then();
	}, []);

	const handleCreate = async () => {
		const handleConfirmCreate = async (name) => {
			try {
				const { id, options } = await generateRegistrationOptionsAction();

				const registrationResponse = await startRegistration({ optionsJSON: options });

				await verifyRegistrationResponseAction({ id, registrationResponse, name });

				localStorage.setItem(`PasskeySeenFromThisBrowser_${registrationResponse.id}`, 'true');
				// localStorage.removeItem(`dontAskAgainForPasskey_${user._id}`);
				dispatchToastMessage({ type: 'success', message: t('Registered_successfully') });
				await findPasskeys();
				closeModal();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		};

		setModal(<PasskeyCreateModel onConfirm={handleConfirmCreate} onClose={closeModal} />);
	};

	const handleEdit = async (passkeyId, initialName) => {
		const handleConfirmEdit = async (name) => {
			try {
				await editPasskeyAction({ passkeyId, name });
				dispatchToastMessage({ type: 'success', message: t('Edited_successfully') });
				await findPasskeys();
				closeModal();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		};

		setModal(<PasskeyEditModel initialName={initialName} onConfirm={handleConfirmEdit} onClose={closeModal} />);
	};
	const handleDelete = async (passkeyId) => {
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
	};

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
						{/* {phase === AsyncStatePhase.LOADING && <GenericTableLoadingTable headerCells={5} />}*/
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
										{passkey.sync && <Tag variant='secondary'>{t('Sync')}</Tag>}
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
