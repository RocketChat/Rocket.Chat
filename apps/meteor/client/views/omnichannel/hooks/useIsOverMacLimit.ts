import { useOmnichannel } from './useOmnichannel';

export const useIsOverMacLimit = (): boolean => {
	const { isOverMacLimit } = useOmnichannel();
	return isOverMacLimit;
};
