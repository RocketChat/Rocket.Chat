import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useMedsensePendingQueue = () => {
    const getPendingMine = useEndpoint('GET', '/v1/medsense/pending.mine');

    const { data } = useQuery({
        queryKey: ['medsense-pending-mine'],
        queryFn: async () => {
            const result = await getPendingMine();
            return (result.rooms || []).map((r: any) => ({
                ...r,
                rid: r._id,
                alert: true,
                unread: 1,
                ts: r.pendingSetAt,
                lm: r.pendingSetAt,
                _updatedAt: r.pendingSetAt,
                lowerCaseName: String(r.fname || r.name).toLowerCase(),
                lowerCaseFname: String(r.fname || r.name).toLowerCase(),
            }));
        },
        refetchInterval: 5000, // Poll every 5s for now
    });

    return {
        queue: data || [],
        enabled: true,
    };
};
