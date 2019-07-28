import React from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import { Icon } from '../basic/Icon';

export function AdminUserInformationStep({ active, formState }) {
	const t = useTranslation();

	const {
		name = {},
		username = {},
		email = {},
		pass = {},
	} = formState;

	return <div
		className={[
			'setup-wizard-forms__content-step',
			active && 'setup-wizard-forms__content-step--active',
		].filter(Boolean).join(' ')}
	>
		<div className='rc-input'>
			<label className='rc-input__label'>
				<div className='rc-input__title'>{t('Name')}</div>
				<div className='rc-input__wrapper'>
					<div className='rc-input__icon'>
						<Icon block='rc-input__icon-sv' icon='user' />
					</div>
					<input type='text' className='rc-input__element js-setting-data' name='registration-name' placeholder={t('Type_your_name')} defaultValue={name.value} />
				</div>
			</label>
		</div>
		<div className={['rc-input', username.invalid && 'rc-input--error'].filter(Boolean).join(' ')}>
			<label className='rc-input__label'>
				<div className='rc-input__title'>{t('Username')}</div>
				<div className='rc-input__wrapper'>
					<div className='rc-input__icon'>
						<Icon block='rc-input__icon-sv' icon='at' />
					</div>
					<input type='text' className='rc-input__element js-setting-data' name='registration-username' placeholder={t('Type_your_username')} defaultValue={username.value} />
				</div>
			</label>
			{username.invalid && <div className='rc-input__error'>
				<div className='rc-input__error-icon'>
					<Icon block='rc-input__error-icon' icon='warning' className='rc-input__error-icon-svg'/>
				</div>
				<div className='rc-input__error-message'>{t('Invalid_username')}</div>
			</div>}
		</div>
		<div className={['rc-input', email.invalid && 'rc-input--error'].filter(Boolean).join(' ')}>
			<label className='rc-input__label'>
				<div className='rc-input__title'>{t('Organization_Email')}</div>
				<div className='rc-input__wrapper'>
					<div className='rc-input__icon'>
						<Icon block='rc-input__icon-sv' icon='mail' />
					</div>
					<input type='email' className='rc-input__element js-setting-data' name='registration-email' placeholder={t('Type_your_email')} defaultValue={email.value} />
				</div>
			</label>
			{email.invalid && <div className='rc-input__error'>
				<div className='rc-input__error-icon'>
					<Icon block='rc-input__error-icon' icon='warning' className='rc-input__error-icon-svg' />
				</div>
				<div className='rc-input__error-message'>{t('Invalid_email')}</div>
			</div>}
		</div>
		<div className='rc-input'>
			<label className='rc-input__label'>
				<div className='rc-input__title'>{t('Password')}</div>
				<div className='rc-input__wrapper'>
					<div className='rc-input__icon'>
						<Icon block='rc-input__icon-sv' icon='key' />
					</div>
					<input type='password' className='rc-input__element js-setting-data' name='registration-pass' placeholder={t('Type_your_password')} defaultValue={pass.value} />
				</div>
			</label>
		</div>
	</div>;
}
