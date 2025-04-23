import type { IOAuthApps, Serialized } from '@rocket.chat/core-typings';
import {
	Button,
	ButtonGroup,
	TextInput,
	Field,
	FieldLabel,
	FieldRow,
	FieldError,
	FieldHint,
	PasswordInput,
	TextAreaInput,
	ToggleSwitch,
	FieldGroup,
} from '@rocket.chat/fuselage';
import { useSetModal, useToastMessageDispatch, useRoute, useAbsoluteUrl, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ReactElement, ComponentProps } from 'react';
import { useCallback, useId, useMemo } from 'react';
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
		mode: 'all',
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
		setModal(
			<GenericModal
				variant='danger'
				onConfirm={onDeleteConfirm}
				onCancel={(): void => setModal(null)}
				onClose={(): void => setModal(null)}
				confirmText={t('Delete')}
			>
				{t('Application_delete_warning')}
			</GenericModal>,
		);

	const nameField = useId();
	const redirectUriField = useId();
	const clientIdField = useId();
	const clientSecretField = useId();
	const authUrlField = useId();
	const tokenUrlField = useId();

	return (
		<ContextualbarScrollableContent w='full' {...props}>
			<FieldGroup maxWidth='x600' alignSelf='center' w='full'>
				<Field>
					<FieldRow>
						<FieldLabel>{t('Active')}</FieldLabel>
						<Controller
							name='active'
							control={control}
							defaultValue={data.active}
							render={({ field }): ReactElement => <ToggleSwitch onChange={field.onChange} checked={field.value} />}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel htmlFor={nameField}>{t('Application_Name')}</FieldLabel>
					<FieldRow>
						<TextInput id={nameField} {...register('name', { required: true })} />
					</FieldRow>
					<FieldHint>{t('Give_the_application_a_name_This_will_be_seen_by_your_users')}</FieldHint>
					{errors?.name && <FieldError>{t('Required_field', { field: t('Name') })}</FieldError>}
				</Field>
				<Field>
					<FieldLabel htmlFor={redirectUriField}>{t('Redirect_URI')}</FieldLabel>
					<FieldRow>
						<TextAreaInput id={redirectUriField} rows={5} {...register('redirectUri', { required: true })} />
					</FieldRow>
					<FieldHint>{t('After_OAuth2_authentication_users_will_be_redirected_to_this_URL')}</FieldHint>
					{errors?.redirectUri && <FieldError>{t('Required_field', { field: t('Redirect_URI') })}</FieldError>}
				</Field>
				<Field>
					<FieldLabel htmlFor={clientIdField}>{t('Client_ID')}</FieldLabel>
					<FieldRow>
						<TextInput id={clientIdField} value={data.clientId} />
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel htmlFor={clientSecretField}>{t('Client_Secret')}</FieldLabel>
					<FieldRow>
						<PasswordInput id={clientSecretField} value={data.clientSecret} />
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel htmlFor={authUrlField}>{t('Authorization_URL')}</FieldLabel>
					<FieldRow>
						<TextInput id={authUrlField} value={authUrl} />
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel htmlFor={tokenUrlField}>{t('Access_Token_URL')}</FieldLabel>
					<FieldRow>
						<TextInput id={tokenUrlField} value={tokenUrl} />
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<ButtonGroup stretch>
							<Button onClick={close}>{t('Cancel')}</Button>
							<Button primary onClick={handleSubmit(onSubmit)}>
								{t('Save')}
							</Button>
						</ButtonGroup>
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<ButtonGroup stretch>
							<Button icon='trash' danger onClick={openConfirmDelete}>
								{t('Delete')}
							</Button>
						</ButtonGroup>
					</FieldRow>
				</Field>
			</FieldGroup>
		</ContextualbarScrollableContent>
	);
};

export default EditOauthApp;
