import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

export const LoginRegister = (): ReactElement => {
	const t = useTranslation();
	return (
		<>
			<div class="rc-input">
						<label class="rc-input__label" for="name">
							<div class="rc-input__wrapper">
								<input name="name" id="name" type="text" class="rc-input__element"
									autocapitalize="off" autocorrect="off"
									placeholder="{{namePlaceholder}}" autofocus>
								<div class="input-error"></div>
							</div>
						</label>
					</div>
					<div class="rc-input">
						<label class="rc-input__label" for="email">
							<div class="rc-input__wrapper">
								<input name="email" id="email" type="text" class="rc-input__element"
									autocapitalize="off" autocorrect="off"
									placeholder="{{_ "Email"}}" autofocus>
								<div class="input-error"></div>
							</div>
						</label>
					</div>

					<div class="rc-input">
						<label class="rc-input__label" for="pass">
							<div class="rc-input__wrapper">
								<input name="pass" id="pass" type="password" class="rc-input__element"
									autocapitalize="off" autocorrect="off"
									placeholder="{{passwordPlaceholder}}" autofocus>
								<div class="input-error"></div>
							</div>
						</label>
					</div>
					{{#if requirePasswordConfirmation}}
						<div class="rc-input">
							<label class="rc-input__label" for="confirm-pass">
								<div class="rc-input__wrapper">
									<input name="confirm-pass" id="confirm-pass" type="password" class="rc-input__element"
										autocapitalize="off" autocorrect="off"
										placeholder="{{confirmPasswordPlaceholder}}" autofocus>
									<div class="input-error"></div>
								</div>
							</label>
						</div>
					{{/if}}
					{{#if manuallyApproveNewUsers}}
						<div class="rc-input">
							<label class="rc-input__label" for="confirm-pass">
								<div class="rc-input__wrapper">
									<input name="reason" id="reason" type="text" class="rc-input__element"
										autocapitalize="off" autocorrect="off"
										placeholder="{{_ 'Reason_To_Join'}}" autofocus>
									<div class="input-error"></div>
								</div>
							</label>
						</div>
					{{/if}}
		</>
	);
};

export default LoginRegister;
