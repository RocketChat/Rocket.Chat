import { useStatistics } from '../views/hooks/useStatistics';

export const useIsSelfHosted = (): { isSelfHosted: boolean; isLoading: boolean } => {
	const { data, isLoading } = useStatistics();

	const isSelfHosted = data?.deploy?.platform !== 'rocket-cloud';

	return { isSelfHosted, isLoading };
};
