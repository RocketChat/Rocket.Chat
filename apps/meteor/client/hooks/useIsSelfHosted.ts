import { useAnalyticsObject } from '../views/admin/viewLogs/hooks/useAnalyticsObject';

export const useIsSelfHosted = (): boolean => {
	const { data } = useAnalyticsObject();

	const isSelfHosted = data?.deploy?.platform !== 'rocket-cloud';

	return isSelfHosted;
};
