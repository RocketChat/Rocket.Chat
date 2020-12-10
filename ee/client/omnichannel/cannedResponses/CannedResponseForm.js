import React from 'react';
import { FieldGroup, Field, TextInput, TextAreaInput } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../client/contexts/TranslationContext';

const CannedResponsesForm = ({ values, handlers }) => {
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
				<TextInput value={shortcut} onChange={handleShortcut} placeholder={t('Shortcut')}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Content')}</Field.Label>
			<Field.Row>
				<TextAreaInput rows={3} value={text} onChange={handleText} placeholder={t('Content')}/>
			</Field.Row>
		</Field>
	</FieldGroup>;
};

export default React.memo(CannedResponsesForm);
