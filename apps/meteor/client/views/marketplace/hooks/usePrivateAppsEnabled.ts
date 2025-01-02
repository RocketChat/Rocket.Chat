import { useLicense } from '../../../hooks/useLicense';

export const usePrivateAppsEnabled = () => {
	const { data: { limits } = {} } = useLicense({ loadValues: true });

	return (limits?.privateApps?.max ?? 0) !== 0;
};
