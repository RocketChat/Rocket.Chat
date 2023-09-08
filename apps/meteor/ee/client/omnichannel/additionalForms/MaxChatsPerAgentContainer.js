import React from 'react';

import { useForm } from '../../../../client/hooks/useForm';
import MaxChatsPerAgent from './MaxChatsPerAgent';

/**
 * Container for MaxChatsPerAgent component.
 * @param {Object} props
 * @param {Object} [props.data]
 * @param {Object} [props.data.livechat]
 * @param {string | number} [props.data.livechat.maxNumberSimultaneousChat]
 * @param {Function} props.onChange
 */
const MaxChatsPerAgentContainer = ({ data: { livechat: { maxNumberSimultaneousChat = '' } = {} } = {}, onChange }) => {
	const { values, handlers, hasUnsavedChanges, commit, reset } = useForm({
		maxNumberSimultaneousChat,
	});

	onChange({ values, hasUnsavedChanges, commit, reset });

	return <MaxChatsPerAgent values={values} handlers={handlers} />;
};

export default MaxChatsPerAgentContainer;
