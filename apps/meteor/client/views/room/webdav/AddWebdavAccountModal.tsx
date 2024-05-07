import type { IWebdavAccountPayload } from '@rocket.chat/core-typings';
import { Modal, Field, FieldGroup, FieldLabel, FieldRow, FieldError, TextInput, PasswordInput, Button, Box } from '@rocket.chat/fuselage';
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
		<Modal wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(onSubmit)} {...props} />}>
			<Modal.Header>
				<Modal.Title>{t('Webdav_add_new_account')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<FieldGroup>
					<Field>
						<FieldLabel>{t('Name_optional')}</FieldLabel>
						<FieldRow>
							<TextInput placeholder={t('Name_optional')} {...register('name')} />
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel>{t('Webdav_Server_URL')}</FieldLabel>
						<FieldRow>
							<TextInput placeholder={t('Webdav_Server_URL')} {...register('serverURL', { required: true })} />
						</FieldRow>
						{errors.serverURL && <FieldError>{t('error-the-field-is-required', { field: t('Webdav_Server_URL') })}</FieldError>}
					</Field>
					<Field>
						<FieldLabel>{t('Username')}</FieldLabel>
						<FieldRow>
							<TextInput placeholder={t('Username')} {...register('username', { required: true })} />
						</FieldRow>
						{errors.username && <FieldError>{t('error-the-field-is-required', { field: t('Username') })}</FieldError>}
					</Field>
					<Field>
						<FieldLabel>{t('Password')}</FieldLabel>
						<FieldRow>
							<PasswordInput placeholder={t('Password')} {...register('password', { required: true })} />
						</FieldRow>
						{errors.password && <FieldError>{t('error-the-field-is-required', { field: t('Password') })}</FieldError>}
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button secondary onClick={onClose}>
						{t('Cancel')}
					</Button>
					<Button primary type='submit' loading={isLoading}>
						{t('Webdav_add_new_account')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default AddWebdavAccountModal;
