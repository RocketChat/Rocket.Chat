import {
	Box,
	Button,
	ButtonGroup,
	Field,
	FieldGroup,
	FieldLabel,
	FieldRow,
	IconButton,
	Margins, TextInput,
} from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useMethod } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useEndpointAction } from '/client/hooks/useEndpointAction';
import { startRegistration } from '@simplewebauthn/browser';
import {
	GenericTable,
	GenericTableBody, GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell, GenericTableRow,
} from '/client/components/GenericTable';
import GenericModal from '/client/components/GenericModal';
import DOMPurify from 'dompurify';
import { Controller } from 'react-hook-form';

const Passkey = (props: ComponentProps<typeof Box>) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const [passkeys, setPasskeys] = useState([]);
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

			await verifyRegistrationResponseAction({ id, registrationResponse })

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

	const findPasskeys = useCallback(async () => {
		try {
			const { passkeys } = await findPasskeysAction()
			setPasskeys(passkeys)
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [findPasskeysAction]);
	useEffect(() => {
		findPasskeys().then()
	}, []);

	const handleEdit = async (passkeyId, name) => {
		setName(name)
		setEditing(passkeyId)
	};
	const handleConfirmEdit = useCallback(async (passkeyId, name) => {
		try {
			await editPasskeyAction({ passkeyId, name })
			dispatchToastMessage({ type: 'success', message: t('Edited_successfully') });
			await findPasskeys();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [editPasskeyAction]);
	const handleDelete = useCallback(async (passkeyId) => {
		try {
			await deletePasskeyAction({ passkeyId })
			dispatchToastMessage({ type: 'success', message: t('Deleted_successfully') });
			await findPasskeys();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [deletePasskeyAction]);

	return (
		<div>
			<GenericTable aria-busy>
				<GenericTableHeader>
					<Box display='flex' justifyContent='space-between' fontScale='h4'>
						{t('Your-passkeys')}
						<Button primary onClick={handleCreate}>
							{t('Add-a-passkey')}
						</Button>
					</Box>
					{/*<GenericTableHeaderCell key='name'>{t('API_Personal_Access_Token_Name')}</GenericTableHeaderCell>*/}
				</GenericTableHeader>
				<GenericTableBody>
					{
						/*{phase === AsyncStatePhase.LOADING && <GenericTableLoadingTable headerCells={5} />}*/
						passkeys?.map((passkey) => (
							<GenericTableRow key={passkey.id}>
								{/*color='default' fontScale='p2m'*/}
								<GenericTableCell withTruncatedText>
									<Box display='flex' flexDirection='column' fontScale='h4'>
										{passkey.name}
										{'             '}
										{'createtime'}
									</Box>
								</GenericTableCell>
								<GenericTableCell withTruncatedText>
									<ButtonGroup>
										<IconButton title={t('Edit')} icon='edit' small secondary onClick={() => handleEdit(passkey.id, passkey.name)} />
										{'   '}
										<IconButton title={t('Delete')} icon='trash' small secondary onClick={() => (handleDelete(passkey.id))} />
									</ButtonGroup>
								</GenericTableCell>
							</GenericTableRow>
						))
					}
				</GenericTableBody>
			</GenericTable>
			{
				editing && <GenericModal title={t('Edit')} onConfirm={() => handleConfirmEdit(editing, name)} onClose={() => setEditing('')}>
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
			}
		</div>
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
