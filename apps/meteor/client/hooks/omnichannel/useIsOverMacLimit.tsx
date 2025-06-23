import { useOmnichannel } from '@rocket.chat/ui-contexts';

export const useIsOverMacLimit = (): boolean => {
	const { isOverMacLimit } = useOmnichannel();
	return isOverMacLimit;
};
