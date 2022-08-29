import { FieldGroup, TextInput, Field, PasswordInput, ButtonGroup, Button, Callout } from '@rocket.chat/fuselage';
import { Form } from '@rocket.chat/layout';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';
import { useForm } from 'react-hook-form';

import { useLoginMethod } from './hooks/useLoginMethod';

export const LoginForm = (): ReactElement => {
	const {
		register,
		handleSubmit,
		setError,
		formState: { errors },
	} = useForm<{
		username: string;
		password: string;
	}>();

	const showFormLogin = useSetting('Accounts_ShowFormLogin');

	const isResetPasswordAllowed = useSetting('Accounts_PasswordReset');

	const t = useTranslation();

	const login = useLoginMethod(console.log);

	if (!showFormLogin) {
		return <>{null}</>;
	}

	console.log('errors', errors);
	return (
		<Form
			onSubmit={handleSubmit(async (data) => {
				try {
					await login(data.username, data.password);
				} catch (error: any) {
					setError('username', { type: 'user-not-found' });
					setError('password', { type: 'user-not-found' });
				}
			})}
		>
			<Form.Header>
				<Form.Title>{t('Login')}</Form.Title>
			</Form.Header>
			<Form.Container>
				<FieldGroup>
					<Field>
						<Field.Label htmlFor='username'>{t('form.adminInfoForm.fields.fullName.label')}</Field.Label>
						<Field.Row>
							<TextInput
								{...register('username', {
									required: true,
								})}
								error={errors.username}
								aria-invalid={errors.username ? 'true' : 'false'}
								id='username'
							/>
						</Field.Row>
						{errors.username && errors.username.type === 'required' && <Field.Error>This is required</Field.Error>}
					</Field>

					<Field>
						<Field.Label htmlFor='password'>{t('form.adminInfoForm.fields.fullName.label')}</Field.Label>
						<Field.Row>
							<PasswordInput
								{...register('password', {
									required: true,
								})}
								error={errors.password}
								aria-invalid={errors.password ? 'true' : 'false'}
								id='password'
							/>
						</Field.Row>
						{errors.password && errors.password.type === 'required' && <Field.Error>This is required</Field.Error>}
						{isResetPasswordAllowed && (
							<Field.Row justifyContent='end'>
								<Field.Link href='#'>Forgot your password?</Field.Link>
							</Field.Row>
						)}
					</Field>
				</FieldGroup>
				<FieldGroup>
					{errors.username?.type === 'user-not-found' && <Callout type='danger'>{t('User_not_found_or_incorrect_password')}</Callout>}
				</FieldGroup>
			</Form.Container>
			<Form.Footer>
				<ButtonGroup>
					<Button type='submit' primary>
						{t('Login')}
					</Button>
				</ButtonGroup>
			</Form.Footer>
		</Form>
	);
	//     {{#if showFormLogin}}
	//     <div class="rc-input">
	//         <label class="rc-input__label" for="emailOrUsername">
	//             <div class="rc-input__wrapper">
	//                 <input name="emailOrUsername" id="emailOrUsername" type="text" class="rc-input__element"
	//                     autocapitalize="off" autocorrect="off"
	//                     placeholder="{{emailOrUsernamePlaceholder}}" autofocus>
	//                 <div class="input-error"></div>
	//             </div>
	//         </label>
	//     </div>
	//     <div class="rc-input">
	//         <label class="rc-input__label" for="pass">
	//             <div class="rc-input__wrapper">
	//                 <input name="pass" id="pass" type="password" class="rc-input__element"
	//                     autocapitalize="off" autocorrect="off"
	//                     placeholder="{{passwordPlaceholder}}" autofocus>
	//                 <div class="input-error"></div>
	//             </div>
	//         </label>
	//     </div>

	//     <div class="rc-button__group rc-button__group--vertical">
	// 				{{#if state 'login'}}
	// 					{{#if showFormLogin}}
	// 						<button class='rc-button rc-button--primary login'>{{btnLoginSave}}</button>
	// 					{{/if}}

	//
	// 						{{#if linkReplacementText}}
	// 							<div class="register-link-replacement">
	// 								{{{linkReplacementText}}}
	// 							</div>
	// 						{{/if}}
	// 					{{/if}}
	// 				{{else}}
	// 					<div class="rc-button__group rc-button__group--vertical">
	// 						<button class='rc-button rc-button--primary login'>{{btnLoginSave}}</button>
	// 					</div>
	// 				{{/if}}
	// 			</div>
	// 		{{/if}}
	// {{/if}}
};

export default LoginForm;
