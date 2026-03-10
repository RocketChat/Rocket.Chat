import { useEndpoint, usePermission } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useMedsenseQueue = () => {
    const canViewQueuePermission = usePermission('medsense-view-request');
    const getPharmacies = useEndpoint('GET', '/v1/medsense/pharmacies.list');

    const { data: pharmacyData, isLoading: isLoadingPharmacies } = useQuery({
        queryKey: ['home-pharmacies'],
        queryFn: async () => getPharmacies({}),
        enabled: canViewQueuePermission,
        retry: false,
    });

    const canViewQueue = canViewQueuePermission;
    const pharmacyIds = (pharmacyData?.pharmacies || []).map((pharmacy: any) => pharmacy._id);

    const getWaitingQueue = useEndpoint('GET', '/v1/medsense/request.list');
    const pendingEnabled = canViewQueue && pharmacyIds.length > 0;
    const { data: pendingCountData, isLoading: isLoadingPending } = useQuery({
        queryKey: ['medsense-waiting-count', pharmacyIds],
        queryFn: async () => {
            if (!canViewQueue || pharmacyIds.length === 0) {
                return { count: 0, requests: [] };
            }
            const results = await Promise.all(
                pharmacyIds.map((pharmacyId: string) => getWaitingQueue({ pharmacyId })),
            );

            const requests: Array<{ _id: string; createdAt: string }> = [];
            const count = results.reduce((total, result) => {
                if (result.requests) {
                    result.requests.forEach((r: any) => requests.push({ _id: r._id, createdAt: r.createdAt }));
                    return total + result.requests.length;
                }
                return total;
            }, 0);

            return { count, requests };
        },
        enabled: pendingEnabled,
        refetchInterval: 5000,
    });

    const getFollowedQueue = useEndpoint('GET', '/v1/medsense/request.followed');
    const followedEnabled = canViewQueue && pharmacyIds.length > 0;
    const { data: followedCountData, isLoading: isLoadingFollowed } = useQuery({
        queryKey: ['medsense-followed-count', pharmacyIds],
        queryFn: async () => {
            if (!canViewQueue || pharmacyIds.length === 0) {
                return { count: 0, requests: [] };
            }
            const results = await Promise.all(
                pharmacyIds.map((pharmacyId: string) => getFollowedQueue({ pharmacyId })),
            );

            const requests: Array<{ _id: string; createdAt: string }> = [];
            const count = results.reduce((total, result) => {
                if (result.requests) {
                    result.requests.forEach((r: any) => requests.push({ _id: r._id, createdAt: r.createdAt }));
                    return total + result.requests.length;
                }
                return total;
            }, 0);

            return { count, requests };
        },
        enabled: followedEnabled,
        refetchInterval: 5000,
    });

    const pendingCount = pendingCountData?.count ?? 0;
    const followedCount = followedCountData?.count ?? 0;
    const allRequests = [...(pendingCountData?.requests || []), ...(followedCountData?.requests || [])];

    const compositeLoading = isLoadingPharmacies ||
        (pendingEnabled && isLoadingPending) ||
        (followedEnabled && isLoadingFollowed) ||
        (!pendingEnabled && pharmacyIds.length === 0 && !isLoadingPharmacies);

    return {
        totalCount: pendingCount + followedCount,
        requests: allRequests,
        canViewQueue,
        loading: compositeLoading
    };
};
