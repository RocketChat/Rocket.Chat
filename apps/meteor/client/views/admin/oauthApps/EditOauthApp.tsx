import { IOAuthApps, Serialized } from '@rocket.chat/core-typings';
import { Button, ButtonGroup, TextInput, Field, Icon, TextAreaInput, ToggleSwitch, FieldGroup } from '@rocket.chat/fuselage';
import { useSetModal, useToastMessageDispatch, useRoute, useMethod, useAbsoluteUrl, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useMemo, ReactElement, ComponentProps } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';

import GenericModal from '../../../components/GenericModal';
import VerticalBar from '../../../components/VerticalBar';

export type EditOAuthAddAppPayload = {
	name: string;
	active: boolean;
	redirectUri: string;
};

export type EditOauthAppProps = {
	onChange: () => void;
	data: Serialized<IOAuthApps>;
} & Omit<ComponentProps<typeof VerticalBar.ScrollableContent>, 'data'>;

const EditOauthApp = ({ onChange, data, ...props }: EditOauthAppProps): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const {
		register,
		handleSubmit,
		formState: { errors },
		control,
	} = useForm<EditOAuthAddAppPayload>({
		defaultValues: {
			name: data.name,
			active: data.active,
			redirectUri: Array.isArray(data.redirectUri) ? data.redirectUri.join('\n') : data.redirectUri,
		},
	});

	const setModal = useSetModal();

	const router = useRoute('admin-oauth-apps');

	const close = useCallback(() => router.push({}), [router]);

	const absoluteUrl = useAbsoluteUrl();
	const authUrl = useMemo(() => absoluteUrl('oauth/authorize'), [absoluteUrl]);
	const tokenUrl = useMemo(() => absoluteUrl('oauth/token'), [absoluteUrl]);

	const saveApp = useMethod('updateOAuthApp');
	const deleteApp = useMethod('deleteOAuthApp');

	const onSubmit: SubmitHandler<EditOAuthAddAppPayload> = async (newData: EditOAuthAddAppPayload) => {
		try {
			await saveApp(data._id, newData);
			dispatchToastMessage({ type: 'success', message: t('Application_updated') });
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: String(error) });
		}
	};

	const onDeleteConfirm = useCallback(async () => {
		try {
			await deleteApp(data._id);

			const handleClose = (): void => {
				setModal();
				close();
			};

			setModal(() => (
				<GenericModal variant='success' onClose={handleClose} onConfirm={handleClose}>
					{t('Your_entry_has_been_deleted')}
				</GenericModal>
			));
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: String(error) });
		}
	}, [close, data._id, deleteApp, dispatchToastMessage, setModal, t]);

	const openConfirmDelete = (): void =>
		setModal(() => (
			<GenericModal
				variant='danger'
				onConfirm={onDeleteConfirm}
				onCancel={(): void => setModal(undefined)}
				onClose={(): void => setModal(undefined)}
				confirmText={t('Delete')}
			>
				{t('Application_delete_warning')}
			</GenericModal>
		));

	return (
		<VerticalBar.ScrollableContent w='full' {...props}>
			<FieldGroup maxWidth='x600' alignSelf='center' w='full'>
				<Field>
					<Field.Label display='flex' justifyContent='space-between' w='full'>
						{t('Active')}
						<Controller
							name='active'
							control={control}
							defaultValue={data.active}
							render={({ field }): ReactElement => <ToggleSwitch onChange={field.onChange} checked={field.value} />}
						/>
					</Field.Label>
				</Field>
				<Field>
					<Field.Label>{t('Application_Name')}</Field.Label>
					<Field.Row>
						<TextInput {...register('name', { required: true })} />
					</Field.Row>
					<Field.Hint>{t('Give_the_application_a_name_This_will_be_seen_by_your_users')}</Field.Hint>
					{errors?.name && <Field.Error>{t('error-the-field-is-required', { field: t('Name') })}</Field.Error>}
				</Field>
				<Field>
					<Field.Label>{t('Redirect_URI')}</Field.Label>
					<Field.Row>
						<TextAreaInput rows={5} {...register('redirectUri', { required: true })} />
					</Field.Row>
					<Field.Hint>{t('After_OAuth2_authentication_users_will_be_redirected_to_this_URL')}</Field.Hint>
					{errors?.redirectUri && <Field.Error>{t('error-the-field-is-required', { field: t('Redirect_URI') })}</Field.Error>}
				</Field>
				<Field>
					<Field.Label>{t('Client_ID')}</Field.Label>
					<Field.Row>
						<TextInput value={data.clientId} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Client_Secret')}</Field.Label>
					<Field.Row>
						<TextInput value={data.clientSecret} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Authorization_URL')}</Field.Label>
					<Field.Row>
						<TextInput value={authUrl} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Access_Token_URL')}</Field.Label>
					<Field.Row>
						<TextInput value={tokenUrl} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Row>
						<ButtonGroup stretch w='full'>
							<Button onClick={close}>{t('Cancel')}</Button>
							<Button primary onClick={handleSubmit(onSubmit)}>
								{t('Save')}
							</Button>
						</ButtonGroup>
					</Field.Row>
				</Field>
				<Field>
					<Field.Row>
						<ButtonGroup stretch w='full'>
							<Button primary danger onClick={openConfirmDelete}>
								<Icon name='trash' mie='x4' />
								{t('Delete')}
							</Button>
						</ButtonGroup>
					</Field.Row>
				</Field>
			</FieldGroup>
		</VerticalBar.ScrollableContent>
	);
};

export default EditOauthApp;
