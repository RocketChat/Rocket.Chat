import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

export const LoginForgotPassword = (): ReactElement => {
	const t = useTranslation();
	return (
		<div class="rc-input">
						<label class="rc-input__label" for="email">
							<div class="rc-input__wrapper">
								<input name="email" id="email" type="text" class="rc-input__element"
									autocapitalize="off" autocorrect="off"
									placeholder="{{_ "Email"}}" autofocus value="{{#if state 'email-verification'}}{{typedEmail}}{{/if}}">
								<div class="input-error"></div>
							</div>
						</label>
					</div>
	);
};

export default LoginForgotPassword;
