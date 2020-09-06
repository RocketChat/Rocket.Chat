import React from 'react';
import { NumberInput, Field } from '@rocket.chat/fuselage';
// import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useForm } from '../../../../client/hooks/useForm';

const MaxChatsPerAgentContainer = ({ data: { livechat: { maxNumberSimultaneousChat = '' } = {} } = {}, onChange }) => {
	const { values, handlers, hasUnsavedChanges, commit, reset } = useForm({ maxNumberSimultaneousChat });

	onChange({ values, hasUnsavedChanges, commit, reset });

	return <MaxChatsPerAgent values={values} handlers={handlers}/>;
};

const MaxChatsPerAgent = ({ values, handlers }) => {
	const t = useTranslation();
	const { maxNumberSimultaneousChat } = values;
	const { handleMaxNumberSimultaneousChat } = handlers;

	return <Field>
		<Field.Label>{t('Max_number_of_chats_per_agent')}</Field.Label>
		<Field.Row>
			<NumberInput value={maxNumberSimultaneousChat} onChange={handleMaxNumberSimultaneousChat} flexGrow={1}/>
		</Field.Row>
	</Field>;
};

export default MaxChatsPerAgentContainer;
