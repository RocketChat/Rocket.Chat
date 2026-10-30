import { useEndpoint, usePermission } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useLicenseDiagnostics = () => {
	const canViewDiagnostics = usePermission('view-privileged-setting');
	const getDiagnostics = useEndpoint('GET', '/v1/licenses.diagnostics');

	return useQuery({
		queryKey: ['licenses', 'diagnostics'],
		queryFn: () => getDiagnostics(),
		enabled: canViewDiagnostics,
	});
};
