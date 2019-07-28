import React from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import { Icon } from '../basic/Icon';

export function RegisterServerStep({ active, formState, allowStandaloneServer }) {
	const t = useTranslation();

	return <div
		className={[
			'setup-wizard-forms__content-step',
			active && 'setup-wizard-forms__content-step--active',
		].filter(Boolean).join(' ')}
	>
		<p className='setup-wizard-forms__content-text'>{t('Register_Server_Info')}</p>
		<div className='setup-wizard-forms__content-register'>
			<label
				className={[
					'setup-wizard-forms__content-register-option',
					formState.registerServer.value && 'setup-wizard-forms__content-register-option--selected',
				].filter(Boolean).join(' ')}
			>
				<div className='setup-wizard-forms__content-register-radio'>
					<input type='radio' name='registerServer' value='true' className='setup-wizard-forms__content-register-radio-element' checked={formState.registerServer.value} onChange={() => {}}/>
					<span className='setup-wizard-forms__content-register-radio-fake' />
					<span className='setup-wizard-forms__content-register-radio-text'>{t('Register_Server_Registered')}</span>
				</div>
				<ul className='setup-wizard-forms__content-register-items'>
					<li className='setup-wizard-forms__content-register-item'><Icon block='setup-wizard-forms__content-register-radio-icon' icon='check' />{t('Register_Server_Registered_Push_Notifications')}</li>
					<li className='setup-wizard-forms__content-register-item'><Icon block='setup-wizard-forms__content-register-radio-icon' icon='check' />{t('Register_Server_Registered_Livechat')}</li>
					<li className='setup-wizard-forms__content-register-item'><Icon block='setup-wizard-forms__content-register-radio-icon' icon='check' />{t('Register_Server_Registered_OAuth')}</li>
					<li className='setup-wizard-forms__content-register-item'><Icon block='setup-wizard-forms__content-register-radio-icon' icon='check' />{t('Register_Server_Registered_Marketplace')}</li>
				</ul>
				<div>
					<label className='setup-wizard-forms__content-register-checkbox'>
						<input type='checkbox' name='optIn' value='true' className='setup-wizard-forms__content-register-checkbox-element' checked={formState.optIn.value} disabled={!formState.registerServer.value} onChange={() => {}}/>
						<span className='setup-wizard-forms__content-register-checkbox-fake'>
							<Icon block='setup-wizard-forms__content-register-checkbox-fake-icon' icon='check' />
						</span>
						<span className='setup-wizard-forms__content-register-checkbox-text'>{t('Register_Server_Opt_In')}</span>
					</label>
				</div>
			</label>
			<label
				className={[
					'setup-wizard-forms__content-register-option',
					!formState.registerServer.value && 'setup-wizard-forms__content-register-option--selected',
					!allowStandaloneServer && 'setup-wizard-forms__content-register-option--disabled',
				].filter(Boolean).join(' ')}
			>
				<div className='setup-wizard-forms__content-register-radio'>
					<input type='radio' name='registerServer' value='false' className='setup-wizard-forms__content-register-radio-element' checked={!formState.registerServer.value} disabled={!allowStandaloneServer} onChange={() => {}}/>
					<span className='setup-wizard-forms__content-register-radio-fake' />
					<span className='setup-wizard-forms__content-register-radio-text'>{t('Register_Server_Standalone')}</span>
				</div>
				<ul className='setup-wizard-forms__content-register-items'>
					<li className='setup-wizard-forms__content-register-item'><Icon block='setup-wizard-forms__content-register-radio-icon' icon='circle' />{t('Register_Server_Standalone_Service_Providers')}</li>
					<li className='setup-wizard-forms__content-register-item'><Icon block='setup-wizard-forms__content-register-radio-icon' icon='circle' />{t('Register_Server_Standalone_Update_Settings')}</li>
					<li className='setup-wizard-forms__content-register-item'><Icon block='setup-wizard-forms__content-register-radio-icon' icon='circle' />{t('Register_Server_Standalone_Own_Certificates')}</li>
				</ul>
			</label>
		</div>
	</div>;
}
