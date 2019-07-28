import React, { Fragment, useContext, useEffect } from 'react';

import { useTranslation } from '../../hooks/useTranslation';
import { Input } from '../basic/Input';
import { SetupWizardFormContext } from './SetupWizardForm';

export function SettingsBasedStep({ active, formState, step }) {
	const t = useTranslation();

	const { setBackEnabled, setContinueEnabled } = useContext(SetupWizardFormContext);

	useEffect(() => {
		if (!active) {
			return;
		}

		setBackEnabled(true);
		setContinueEnabled(true);
	}, [active]);

	const fields = Object.values(formState).filter((setting) => setting.step === step);

	return <>
		{fields.map(({ id, type, label, value, options, setValue }, i) => <Fragment key={i}>
			{type === 'string'
				&& <Input
					type='text'
					title={t(label)}
					name={id}
					value={value}
					onChange={({ currentTarget: { value } }) => setValue(value)}
				/>}

			{type === 'select'
				&& <Input
					type='select'
					title={t(label)}
					name={id}
					placeholder={t('Select_an_option')}
					options={options.map(({ label, value }) => ({ label: t(label), value }))}
					value={value || ''}
					onChange={({ currentTarget: { value } }) => setValue(value)}
				/>}

			{type === 'language'
				&& <Input
					type='select'
					title={t(label)}
					name={id}
					placeholder={t('Default')}
					options={options}
					value={value || ''}
					onChange={({ currentTarget: { value } }) => setValue(value)}
				/>}
		</Fragment>)}
	</>;
}
