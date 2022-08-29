import { FieldGroup, TextInput, Field, PasswordInput, ButtonGroup, Button, Box } from '@rocket.chat/fuselage';
import { Form } from '@rocket.chat/layout';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

export const LoginForm = (): ReactElement => {
	const t = useTranslation();
	return (
		<Form>
			<Form.Header>
				<Form.Title>{t('Reset_Password')}</Form.Title>
			</Form.Header>
			<Form.Container>
				<FieldGroup>
					<Field>
						<Field.Label htmlFor='email'>{t('form.adminInfoForm.fields.fullName.label')}</Field.Label>
						<Field.Row>
							<TextInput
								// {...register('fullname', {
								// 	required: String(t('component.form.requiredField')),
								// })}
								// placeholder={t('form.adminInfoForm.fields.fullName.placeholder')}
								id='email'
							/>
						</Field.Row>
						{/* {errors.fullname && <Field.Error>{errors.fullname.message}</Field.Error>} */}
					</Field>
				</FieldGroup>
			</Form.Container>
			<Form.Footer>
				<ButtonGroup>
					<Button primary>{t('Login')}</Button>
				</ButtonGroup>

				{/* passwordResetAllowed */}
				<Box mbs='x24' fontScale='p2' textAlign='left'>
					Forgot your password? Reset password
				</Box>
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
