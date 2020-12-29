import React from 'react';
import { FieldGroup, Field, TextInput, TextAreaInput } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../client/contexts/TranslationContext';

const CannedResponsesForm = ({ values, handlers, errors }) => {
	const t = useTranslation();
	const {
		shortcut,
		text,
	} = values;

	const {
		handleShortcut,
		handleText,
	} = handlers;

	return <FieldGroup>
		<Field>
			<Field.Label>{t('Shortcut')}</Field.Label>
			<Field.Row>
				<TextInput error={errors && errors.shortcut} value={shortcut} onChange={handleShortcut} placeholder={t('Shortcut')}/>
			</Field.Row>
			{errors && errors.shortcut && <Field.Error>
				{errors.shortcut}
			</Field.Error>}
		</Field>
		<Field>
			<Field.Label>{t('Content')}</Field.Label>
			<Field.Row>
				<TextAreaInput error={errors && errors.text} rows={3} value={text} onChange={handleText} placeholder={t('Content')}/>
			</Field.Row>
			{errors && errors.text && <Field.Error>
				{errors.text}
			</Field.Error>}
		</Field>
	</FieldGroup>;
};

export default React.memo(CannedResponsesForm);
