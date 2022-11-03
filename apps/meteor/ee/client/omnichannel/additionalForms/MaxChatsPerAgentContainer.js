import React from 'react';

import { useForm } from '../../../../client/hooks/useForm';
import MaxChatsPerAgent from './MaxChatsPerAgent';

const MaxChatsPerAgentContainer = ({ data: { livechat: { maxNumberSimultaneousChat = '' } = {} } = {}, onChange }) => {
	const { values, handlers, hasUnsavedChanges, commit, reset } = useForm({
		maxNumberSimultaneousChat,
	});

	onChange({ values, hasUnsavedChanges, commit, reset });

	return <MaxChatsPerAgent values={values} handlers={handlers} />;
};

export default MaxChatsPerAgentContainer;
