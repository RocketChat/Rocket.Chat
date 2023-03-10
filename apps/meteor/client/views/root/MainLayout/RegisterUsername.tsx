import type { IUser } from '@rocket.chat/core-typings';
import { TextInput, ButtonGroup, Button, FieldGroup, Field, Box } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { VerticalWizardLayout, Form } from '@rocket.chat/layout';
import {
	useSetting,
	useTranslation,
	useLogout,
	useEndpoint,
	useUserId,
	useToastMessageDispatch,
	useAssetWithDarkModePath,
} from '@rocket.chat/ui-contexts';
import type { UseMutationResult } from '@tanstack/react-query';
import { useQuery, useMutation } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import CustomFieldsAssembler from './CustomFields/CustomFieldsAssembler';

type RegisterUsernamePayload = {
	username: IUser['username'];
	customFields?: IUser['customFields'];
};

const RegisterUsername = () => {
	const t = useTranslation();
	const uid = useUserId();
	const logout = useLogout();
	const formLabelId = useUniqueId();
	const hideLogo = useSetting<boolean>('Layout_Login_Hide_Logo');
	const customLogo = useAssetWithDarkModePath('logo');
	const customBackground = useAssetWithDarkModePath('background');
	const dispatchToastMessage = useToastMessageDispatch();

	if (!uid) {
		throw new Error('Invalid user');
	}

	const saveUserData = useEndpoint('POST', '/v1/users.update');
	const usernameSuggestion = useEndpoint('GET', '/v1/users.getUsernameSuggestion');
	const { data, isLoading } = useQuery(['suggestion'], async () => usernameSuggestion());

	const {
		register,
		handleSubmit,
		setValue,
		getValues,
		setError,
		control,
		formState: { errors },
	} = useForm();

	useEffect(() => {
		if (data?.result && getValues('username') === '') {
			setValue('username', data.result);
		}
	});

	const registerUsernameMutation: UseMutationResult<
		void,
		Error,
		{
			username: string;
			customFields: Record<string, unknown>;
		}
	> = useMutation({
		mutationFn: (data) => {
			const { username, ...customFields } = data;
			return saveUserData({ userId: uid, data: { username, customFields: { ...customFields } } });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Username_has_been_updated') });
		},
		onError: (error: any, { username }) => {
			if ([error.error, error.errorType].includes('error-blocked-username')) {
				setError('username', { type: 'error-blocked-username', message: t('error-blocked-username', { field: username }) });
			}

			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	return (
		<VerticalWizardLayout
			background={customBackground}
			logo={!hideLogo && customLogo ? <Box is='img' maxHeight='x40' mi='neg-x8' src={customLogo} alt='Logo' /> : <></>}
		>
			<Form aria-labelledby={formLabelId} onSubmit={handleSubmit((data) => registerUsernameMutation.mutate(data))}>
				<Form.Header>
					<Form.Title id={formLabelId}>{t('Username_title')}</Form.Title>
					<Form.Subtitle>{t('Username_description')}</Form.Subtitle>
				</Form.Header>
				<Form.Container>
					{!isLoading && (
						<FieldGroup>
							<Field>
								<Field.Label>{t('Username')}</Field.Label>
								<Field.Row>
									<TextInput {...register('username', { required: t('Username_cant_be_empty') })} />
								</Field.Row>
								{errors.username && <Field.Error>{errors.username.message}</Field.Error>}
							</Field>
						</FieldGroup>
					)}
					{isLoading && t('Loading_suggestion')}
					<CustomFieldsAssembler formControl={control} />
				</Form.Container>
				<Form.Footer>
					<ButtonGroup stretch vertical flexGrow={1}>
						<Button disabled={isLoading} type='submit' primary>
							{t('Use_this_username')}
						</Button>
						<Button onClick={logout}>{t('Logout')}</Button>
					</ButtonGroup>
				</Form.Footer>
			</Form>
		</VerticalWizardLayout>
	);
};

export default RegisterUsername;
