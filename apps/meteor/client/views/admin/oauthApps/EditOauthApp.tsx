import type { IOAuthApps, Serialized } from '@rocket.chat/core-typings';
import { Button, ButtonGroup, TextInput, Field, TextAreaInput, ToggleSwitch, FieldGroup } from '@rocket.chat/fuselage';
import { useSetModal, useToastMessageDispatch, useRoute, useAbsoluteUrl, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ReactElement, ComponentProps } from 'react';
import React, { useCallback, useMemo } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm, Controller } from 'react-hook-form';

import { ContextualbarScrollableContent } from '../../../components/Contextualbar';
import GenericModal from '../../../components/GenericModal';

type EditOAuthAddAppPayload = {
	name: string;
	active: boolean;
	redirectUri: string;
};

type EditOauthAppProps = {
	onChange: () => void;
	data: Serialized<IOAuthApps>;
} & Omit<ComponentProps<typeof ContextualbarScrollableContent>, 'data'>;

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

	const saveApp = useEndpoint('POST', '/v1/oauth-apps.update');
	const deleteApp = useEndpoint('POST', '/v1/oauth-apps.delete');

	const onSubmit: SubmitHandler<EditOAuthAddAppPayload> = async (newData: EditOAuthAddAppPayload) => {
		try {
			await saveApp({ ...newData, appId: data._id });
			dispatchToastMessage({ type: 'success', message: t('Application_updated') });
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const onDeleteConfirm = useCallback(async () => {
		try {
			await deleteApp({ appId: data._id });
			dispatchToastMessage({ type: 'success', message: t('Your_entry_has_been_deleted') });
			close();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setModal(null);
		}
	}, [data._id, close, deleteApp, dispatchToastMessage, setModal, t]);

	const openConfirmDelete = (): void =>
		setModal(() => (
			<GenericModal
				variant='danger'
				onConfirm={onDeleteConfirm}
				onCancel={(): void => setModal(null)}
				onClose={(): void => setModal(null)}
				confirmText={t('Delete')}
			>
				{t('Application_delete_warning')}
			</GenericModal>
		));

	return (
		<ContextualbarScrollableContent w='full' {...props}>
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
							<Button icon='trash' danger onClick={openConfirmDelete}>
								{t('Delete')}
							</Button>
						</ButtonGroup>
					</Field.Row>
				</Field>
			</FieldGroup>
		</ContextualbarScrollableContent>
	);
};

export default EditOauthApp;
