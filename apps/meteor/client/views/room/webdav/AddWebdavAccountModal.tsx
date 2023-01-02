import type { IWebdavAccountPayload } from '@rocket.chat/core-typings';
import { Modal, Field, FieldGroup, TextInput, PasswordInput, Button } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';

type AddWebdavAccountModalPayload = IWebdavAccountPayload;

type AddWebdavAccountModalProps = {
	onClose: () => void;
	onConfirm: () => void;
};

const AddWebdavAccountModal = ({ onClose, onConfirm }: AddWebdavAccountModalProps): ReactElement => {
	const handleAddWebdavAccount = useMethod('addWebdavAccount');
	const dispatchToastMessage = useToastMessageDispatch();
	const [isLoading, setIsLoading] = useState(false);
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<AddWebdavAccountModalPayload>();
	const t = useTranslation();

	const onSubmit: SubmitHandler<AddWebdavAccountModalPayload> = async (data) => {
		setIsLoading(true);

		try {
			await handleAddWebdavAccount(data);
			return dispatchToastMessage({ type: 'success', message: t('webdav-account-saved') });
		} catch (error) {
			return dispatchToastMessage({ type: 'error', message: error });
		} finally {
			onConfirm();
			setIsLoading(false);
		}
	};

	return (
		<Modal is='form' onSubmit={handleSubmit(onSubmit)}>
			<Modal.Header>
				<Modal.Title>{t('Webdav_add_new_account')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<FieldGroup>
					<Field>
						<Field.Label>{t('Name_optional')}</Field.Label>
						<Field.Row>
							<TextInput placeholder={t('Name_optional')} {...register('name')} />
						</Field.Row>
					</Field>
					<Field>
						<Field.Label>{t('Webdav_Server_URL')}</Field.Label>
						<Field.Row>
							<TextInput placeholder={t('Webdav_Server_URL')} {...register('serverURL', { required: true })} />
						</Field.Row>
						{errors.serverURL && <Field.Error>{t('error-the-field-is-required', { field: t('Webdav_Server_URL') })}</Field.Error>}
					</Field>
					<Field>
						<Field.Label>{t('Username')}</Field.Label>
						<Field.Row>
							<TextInput placeholder={t('Username')} {...register('username', { required: true })} />
						</Field.Row>
						{errors.username && <Field.Error>{t('error-the-field-is-required', { field: t('Username') })}</Field.Error>}
					</Field>
					<Field>
						<Field.Label>{t('Password')}</Field.Label>
						<Field.Row>
							<PasswordInput placeholder={t('Password')} {...register('password', { required: true })} />
						</Field.Row>
						{errors.password && <Field.Error>{t('error-the-field-is-required', { field: t('Password') })}</Field.Error>}
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button secondary onClick={onClose}>
						{t('Cancel')}
					</Button>
					<Button primary type='submit' disabled={isLoading}>
						{isLoading ? t('Please_wait') : t('Webdav_add_new_account')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default AddWebdavAccountModal;
