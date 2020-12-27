import React, { memo, useMemo } from 'react';
import { Select, Field } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';

const defaultOptions = {};

const CustomSelect = ({ name, required, options = defaultOptions, setState, state, className }) => {
	const t = useTranslation();
	const mappedOptions = useMemo(() => Object.values(options).map((value) => [value, value]), [options]);
	const verify = useMemo(() => (!state.length && required ? t('Field_required') : ''), [required, state.length, t]);

	return <Field className={className}>
		<Field.Label>{t(name)}{required && '*'}</Field.Label>
		<Field.Row>
			<Select name={name} error={verify} flexGrow={1} value={state} options={mappedOptions} required={required} onChange={(val) => setState(val)}/>
		</Field.Row>
		<Field.Error>{verify}</Field.Error>
	</Field>;
};

export default memo(CustomSelect);
