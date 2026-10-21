import { useSetting } from '@rocket.chat/ui-contexts';

export const useIsFederationEnabled = () => {
	return useSetting('Federation_Service_Enabled', false);
};
