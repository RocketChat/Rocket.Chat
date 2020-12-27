import React, { memo, useMemo } from 'react';
import { Field, TextInput } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';

const CustomTextInput = ({ name, required, minLength, maxLength, setState, state, className }) => {
	const t = useTranslation();

	const verify = useMemo(() => {
		const errors = [];

		if (!state && required) {
			errors.push(t('Field_required'));
		}

		if (state.length < minLength && state.length > 0) {
			errors.push(t('Min_length_is', minLength));
		}

		return errors.join(', ');
	}, [state, required, minLength, t]);

	return <Field className={className}>
		<Field.Label>{t(name)}{required && '*'}</Field.Label>
		<Field.Row>
			<TextInput name={name} error={verify} maxLength={maxLength} flexGrow={1} value={state} required={required} onChange={(e) => setState(e.currentTarget.value)}/>
		</Field.Row>
		<Field.Error>{verify}</Field.Error>
	</Field>;
};

export default memo(CustomTextInput);
