import { useOmnichannel } from './useOmnichannel';

export const useOmnichannelEnterpriseEnabled = () => {
	const { enabled: isEnabled, isEnterprise } = useOmnichannel();
	return isEnabled && isEnterprise;
};
