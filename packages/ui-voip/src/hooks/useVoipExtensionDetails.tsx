import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useVoipExtensionDetails = ({ extension, enabled = true }: { extension: string | undefined; enabled?: boolean }) => {
	const isEnabled = !!extension && enabled;
	const getContactDetails = useEndpoint('GET', '/v1/voip-freeswitch.extension.getDetails');
	const { data, ...result } = useQuery({
		queryKey: ['voip', 'voip-extension-details', extension, getContactDetails],
		queryFn: () => getContactDetails({ extension: extension as string }),
		enabled: isEnabled
	});

	return {
		data: isEnabled ? data : undefined,
		...result,
	};
};
