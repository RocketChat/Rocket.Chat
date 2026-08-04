import { useOmnichannel } from './useOmnichannel';

export const useOmnichannelEnterpriseEnabled = (): boolean => {
	const { enabled: isEnabled, isEnterprise } = useOmnichannel();
	return isEnabled && isEnterprise;
};
