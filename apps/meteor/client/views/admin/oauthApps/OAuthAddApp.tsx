import {
	Button,
	ButtonGroup,
	TextInput,
	Field,
	FieldLabel,
	FieldRow,
	FieldError,
	FieldHint,
	TextAreaInput,
	ToggleSwitch,
	FieldGroup,
} from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useRoute, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useCallback, useId } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { ContextualbarScrollableContent } from '../../../components/Contextualbar';

type OAuthAddAppPayload = {
	name: string;
	active: boolean;
	redirectUri: string;
};

const OAuthAddApp = (): ReactElement => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const {
		register,
		handleSubmit,
		formState: { errors },
		control,
	} = useForm<OAuthAddAppPayload>();

	const saveApp = useEndpoint('POST', '/v1/oauth-apps.create');

	const router = useRoute('admin-oauth-apps');

	const close = useCallback(() => router.push({}), [router]);

	const onSubmit: SubmitHandler<OAuthAddAppPayload> = async (data) => {
		try {
			await saveApp(data);
			close();
			dispatchToastMessage({ type: 'success', message: t('Application_added') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const nameField = useId();
	const redirectUriField = useId();

	return (
		<ContextualbarScrollableContent w='full'>
			<FieldGroup maxWidth='x600' alignSelf='center' w='full'>
				<Field>
					<FieldRow>
						<FieldLabel>{t('Active')}</FieldLabel>
						<Controller
							name='active'
							control={control}
							defaultValue={false}
							render={({ field }): ReactElement => <ToggleSwitch onChange={field.onChange} checked={field.value} />}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel htmlFor={nameField}>{t('Application_Name')}</FieldLabel>
					<FieldRow>
						<TextInput id={nameField} {...register('name', { required: t('Required_field', { field: t('Name') }) })} />
					</FieldRow>
					<FieldHint>{t('Give_the_application_a_name_This_will_be_seen_by_your_users')}</FieldHint>
					{errors?.name && <FieldError>{errors.name.message}</FieldError>}
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
					<FieldRow>
						<ButtonGroup stretch>
							<Button onClick={close}>{t('Cancel')}</Button>
							<Button primary onClick={handleSubmit(onSubmit)}>
								{t('Save')}
							</Button>
						</ButtonGroup>
					</FieldRow>
				</Field>
			</FieldGroup>
		</ContextualbarScrollableContent>
	);
};

export default OAuthAddApp;
