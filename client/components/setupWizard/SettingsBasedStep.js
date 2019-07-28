import React, { Fragment } from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import { Icon } from '../basic/Icon';

export function SettingsBasedStep({ active, formState, step }) {
	const t = useTranslation();

	const fields = Object.values(formState).filter((setting) => setting.step === step);

	return <div
		className={[
			'setup-wizard-forms__content-step',
			active && 'setup-wizard-forms__content-step--active',
		].filter(Boolean).join(' ')}
	>
		{fields.map(({ id, type, label, value, options }, i) => <Fragment key={i}>
			{type === 'string'
				&& <div className='rc-input'>
					<label className='rc-input__label'>
						<div className='rc-input__title'>{t(label)}</div>
						<div className='rc-input__wrapper'>
							<input type='text' className='rc-input__element js-setting-data' name={id} defaultValue={value} />
						</div>
					</label>
				</div>}

			{type === 'select'
				&& <div className='rc-input'>
					<label className='rc-input__label'>
						<div className='rc-input__title'>{t(label)}</div>
						<div className='rc-select'>
							<select className='rc-select__element js-setting-data' name={id} defaultValue={value}>
								<option>{t('Select_an_option')}</option>
								{options.map(({ optionLabel, optionValue }, j) =>
									<option key={j} className='rc-select__option' value={optionValue}>{t(optionLabel)}</option>
								)}
							</select>
							<Icon block='rc-select__arrow' icon='arrow-down' />
						</div>
					</label>
				</div>}

			{type === 'language'
				&& <div className='rc-input'>
					<label className='rc-input__label'>
						<div className='rc-input__title'>{t(label)}</div>
						<div className='rc-select'>
							<select className='rc-select__element js-setting-data' name={id} defaultValue={value}>
								<option>{t('Default')}</option>
								{options.map(({ optionLabel, optionValue }, j) =>
									<option key={j} className='rc-select__option' value={optionValue} dir='auto'>{t(optionLabel)}</option>
								)}
							</select>
							<Icon block='rc-select__arrow' icon='arrow-down' />
						</div>
					</label>
				</div>}
		</Fragment>)}
	</div>;
}
