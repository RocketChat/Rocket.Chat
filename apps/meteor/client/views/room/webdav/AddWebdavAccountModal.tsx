import type { IWebdavAccountPayload } from '@rocket.chat/core-typings';
import { Modal, Field, FieldGroup, FieldLabel, FieldRow, FieldError, TextInput, PasswordInput, Button, Box } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useMethod } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

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
	const { t } = useTranslation();

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
							<TextInput
								placeholder={t('Webdav_Server_URL')}
								{...register('serverURL', { required: t('Required_field', { field: t('Webdav_Server_URL') }) })}
							/>
						</FieldRow>
						{errors.serverURL && <FieldError>{errors.serverURL.message}</FieldError>}
					</Field>
					<Field>
						<FieldLabel>{t('Username')}</FieldLabel>
						<FieldRow>
							<TextInput
								placeholder={t('Username')}
								{...register('username', { required: t('Required_field', { field: t('Username') }) })}
							/>
						</FieldRow>
						{errors.username && <FieldError>{errors.username.message}</FieldError>}
					</Field>
					<Field>
						<FieldLabel>{t('Password')}</FieldLabel>
						<FieldRow>
							<PasswordInput
								placeholder={t('Password')}
								{...register('password', { required: t('Required_field', { field: t('Password') }) })}
							/>
						</FieldRow>
						{errors.password && <FieldError>{errors.password.message}</FieldError>}
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
