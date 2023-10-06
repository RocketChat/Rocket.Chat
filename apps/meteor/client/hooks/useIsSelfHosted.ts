import { useStatistics } from '../views/hooks/useStatistics';

export const useIsSelfHosted = (): boolean => {
	const { data } = useStatistics();

	const isSelfHosted = data?.deploy?.platform !== 'rocket-cloud';

	return isSelfHosted;
};
