import type { ISetting } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

type SetupWizardParameters = {
	settings: ISetting[];
	serverAlreadyRegistered: boolean;
};

export const useParameters = (): Exclude<UseQueryResult<SetupWizardParameters, Error>, { data: undefined }> => {
	const getSetupWizardParameters = useEndpoint('GET', '/v1/setupWizard.parameters');

	return useQuery({
		queryKey: ['setupWizard/parameters'],
		queryFn: () => getSetupWizardParameters(),
		initialData: {
			settings: [],
			serverAlreadyRegistered: false,
		},
	}) as Exclude<UseQueryResult<SetupWizardParameters, Error>, { data: undefined }>;
};
