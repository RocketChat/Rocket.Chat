import { useOmnichannel } from '@rocket.chat/ui-contexts';

export const useOmnichannelEnterpriseEnabled = (): boolean => {
	const { enabled: isEnabled, isEnterprise } = useOmnichannel();
	return isEnabled && isEnterprise;
};
