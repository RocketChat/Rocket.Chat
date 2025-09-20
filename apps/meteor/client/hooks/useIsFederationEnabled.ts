import { useSetting } from '@rocket.chat/ui-contexts';

export const useIsFederationEnabled = () => {
	const federationMatrixEnabled = useSetting('Federation_Matrix_enabled', false) === true;
	return federationMatrixEnabled;
};
