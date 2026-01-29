import { useSetting } from '@rocket.chat/ui-contexts';

export const useIsFederationEnabled = () => {
	const matrixFederationEnabled = useSetting('Federation_Matrix_enabled', false);
	const serviceFederationEnabled = useSetting('Federation_Service_Enabled', false);
	const federationEnabled = matrixFederationEnabled || serviceFederationEnabled;
	return federationEnabled;
};
