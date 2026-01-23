
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useMedsenseHubActions = () => {
    const listActions = useEndpoint('GET', '/v1/medsense/hub.actions');

    return useQuery({
        queryKey: ['medsense/hub.actions'],
        queryFn: async () => {
            const { actions } = await listActions();
            return actions || [];
        }
    });
};
