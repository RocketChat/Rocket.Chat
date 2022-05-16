import { Button, ButtonGroup, TextInput, Field, TextAreaInput, ToggleSwitch, FieldGroup } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useRoute, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useCallback } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';

import VerticalBar from '../../../components/VerticalBar';

type OAuthAddAppPayload = {
	name: string;
	active: boolean;
	redirectUri: string;
};

const OAuthAddApp = (): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const {
		register,
		handleSubmit,
		formState: { errors },
		control,
	} = useForm<OAuthAddAppPayload>();

	const saveApp = useMethod('addOAuthApp');

	const router = useRoute('admin-oauth-apps');

	const close = useCallback(() => router.push({}), [router]);

	const onSubmit: SubmitHandler<OAuthAddAppPayload> = async (data) => {
		try {
			await saveApp(data);
			close();
			dispatchToastMessage({ type: 'success', message: t('Application_added') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: String(error) });
		}
	};

	return (
		<VerticalBar.ScrollableContent w='full'>
			<FieldGroup maxWidth='x600' alignSelf='center' w='full'>
				<Field>
					<Field.Label display='flex' justifyContent='space-between' w='full'>
						{t('Active')}
						<Controller
							name='active'
							control={control}
							defaultValue={false}
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
					<Field.Row>
						<ButtonGroup stretch w='full'>
							<Button onClick={close}>{t('Cancel')}</Button>
							<Button primary onClick={handleSubmit(onSubmit)}>
								{t('Save')}
							</Button>
						</ButtonGroup>
					</Field.Row>
				</Field>
			</FieldGroup>
		</VerticalBar.ScrollableContent>
	);
};

export default OAuthAddApp;
