import React from 'react';

import { useForm } from '../../../../client/hooks/useForm';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import MaxChatsPerAgent from './MaxChatsPerAgent';

const MaxChatsPerAgentContainer = ({ data: { livechat: { maxNumberSimultaneousChat = '' } = {} } = {}, onChange }) => {
	const hasLicense = useHasLicenseModule('livechat-enterprise');

	const { values, handlers, hasUnsavedChanges, commit, reset } = useForm({
		maxNumberSimultaneousChat,
	});

	onChange({ values, hasUnsavedChanges, commit, reset });

	if (!hasLicense) {
		return null;
	}

	return <MaxChatsPerAgent values={values} handlers={handlers} />;
};

export default MaxChatsPerAgentContainer;
