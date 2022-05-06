import type { ISetting } from '@rocket.chat/core-typings';
import { useQuery, UseQueryResult } from 'react-query';

import { useMethod } from '../../../contexts/ServerContext';

type SetupWizardParameters = {
	settings: ISetting[];
	serverAlreadyRegistered: boolean;
	hasAdmin: boolean;
};

export const useParameters = (): Exclude<UseQueryResult<SetupWizardParameters, Error>, { data: undefined }> => {
	const getSetupWizardParameters = useMethod('getSetupWizardParameters');

	return useQuery(['setupWizard/parameters'], getSetupWizardParameters, {
		initialData: {
			settings: [],
			serverAlreadyRegistered: false,
			hasAdmin: false,
		},
	}) as Exclude<UseQueryResult<SetupWizardParameters, Error>, { data: undefined }>;
};
